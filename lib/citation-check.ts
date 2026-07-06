function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

interface PlatformResult {
  cited: boolean;
  mentionContext: string | null;
}

async function checkPerplexity(
  phrase: string,
  domain: string
): Promise<PlatformResult | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [{ role: "user", content: phrase }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Perplexity API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const citations: string[] = data.citations ?? [];
  const cited = citations.some((url) => url.includes(domain));

  return {
    cited,
    mentionContext: cited
      ? citations.find((url) => url.includes(domain)) ?? null
      : null,
  };
}

async function checkOpenAI(
  phrase: string,
  domain: string
): Promise<PlatformResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-search-preview",
      web_search_options: {},
      messages: [{ role: "user", content: phrase }],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message;
  const annotationUrls: string[] = (message?.annotations ?? [])
    .map((a: { url_citation?: { url?: string } }) => a.url_citation?.url)
    .filter(Boolean);
  const content: string = message?.content ?? "";

  const cited =
    annotationUrls.some((url) => url.includes(domain)) ||
    content.includes(domain);

  return {
    cited,
    mentionContext: cited
      ? (annotationUrls.find((url) => url.includes(domain)) ?? domain)
      : null,
  };
}

async function checkClaude(
  phrase: string,
  domain: string
): Promise<PlatformResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: phrase }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const blocks: Array<{
    type: string;
    text?: string;
    citations?: Array<{ url?: string }>;
  }> = data.content ?? [];
  const citationUrls = blocks
    .flatMap((b) => b.citations ?? [])
    .map((c) => c.url)
    .filter(Boolean) as string[];
  const fullText = blocks.map((b) => b.text ?? "").join(" ");

  const cited =
    citationUrls.some((url) => url.includes(domain)) ||
    fullText.includes(domain);

  return {
    cited,
    mentionContext: cited
      ? (citationUrls.find((url) => url.includes(domain)) ?? domain)
      : null,
  };
}

export async function checkPhraseCitations(phrase: string, websiteUrl: string) {
  const domain = extractDomain(websiteUrl);
  if (!domain) throw new Error("Client has no valid website URL");

  const [perplexity, openai, claude] = await Promise.all([
    checkPerplexity(phrase, domain).catch(() => null),
    checkOpenAI(phrase, domain).catch(() => null),
    checkClaude(phrase, domain).catch(() => null),
  ]);

  return {
    perplexity: perplexity ? { ...perplexity, source: "direct_api" as const } : null,
    chatgpt: openai ? { ...openai, source: "direct_api" as const } : null,
    claude: claude ? { ...claude, source: "direct_api" as const } : null,
  };
}
