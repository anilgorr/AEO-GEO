"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkPhraseCitations } from "@/lib/citation-check";

export async function runCitationCheck(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: client } = await supabase
    .from("clients")
    .select("website_url")
    .eq("id", clientId)
    .single();
  if (!client?.website_url) {
    throw new Error("Client needs a website URL before checking citations.");
  }

  const { data: phrases } = await supabase
    .from("tracked_phrases")
    .select("id, phrase")
    .eq("client_id", clientId)
    .eq("locked", true);

  if (!phrases || phrases.length === 0) {
    throw new Error("No locked phrase list for this client yet.");
  }

  const hasAnyKey =
    process.env.PERPLEXITY_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY;
  if (!hasAnyKey) {
    throw new Error(
      "No citation-check API keys configured (PERPLEXITY_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY)."
    );
  }

  let checksWritten = 0;

  for (const phrase of phrases) {
    const results = await checkPhraseCitations(phrase.phrase, client.website_url);

    const maybeRows = [
      results.perplexity && {
        phrase_id: phrase.id,
        platform: "perplexity" as const,
        source: results.perplexity.source,
        cited: results.perplexity.cited,
        mention_context: results.perplexity.mentionContext,
      },
      results.chatgpt && {
        phrase_id: phrase.id,
        platform: "chatgpt" as const,
        source: results.chatgpt.source,
        cited: results.chatgpt.cited,
        mention_context: results.chatgpt.mentionContext,
      },
      results.claude && {
        phrase_id: phrase.id,
        platform: "claude" as const,
        source: results.claude.source,
        cited: results.claude.cited,
        mention_context: results.claude.mentionContext,
      },
    ];
    const rows = maybeRows.filter(
      (row): row is NonNullable<typeof row> => row !== null && row !== undefined
    );

    if (rows.length > 0) {
      const { error } = await supabase.from("citation_checks").insert(rows);
      if (error) throw new Error(error.message);
      checksWritten += rows.length;
    }
  }

  revalidatePath("/monitoring");
  return { checksWritten, phraseCount: phrases.length };
}
