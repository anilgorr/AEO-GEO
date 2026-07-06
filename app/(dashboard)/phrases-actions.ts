"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addTrackedPhrase(clientId: string, phrase: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = phrase.trim();
  if (!trimmed) return;

  const { error } = await supabase
    .from("tracked_phrases")
    .insert({ client_id: clientId, phrase: trimmed });

  if (error) throw new Error(error.message);

  revalidatePath("/monitoring");
}

export async function removeTrackedPhrase(phraseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("tracked_phrases")
    .delete()
    .eq("id", phraseId)
    .eq("locked", false);

  if (error) throw new Error(error.message);

  revalidatePath("/monitoring");
}

export async function lockPhraseList(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("tracked_phrases")
    .update({ locked: true })
    .eq("client_id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath("/monitoring");
}
