const AGENT_MODEL = "anthropic/claude-sonnet-4.5";

export class AgentUnavailableError extends Error {
  constructor() {
    super("OPENROUTER_API_KEY is not configured — agents are unavailable.");
    this.name = "AgentUnavailableError";
  }
}

/**
 * Calls the agent model (via OpenRouter) with a system prompt + user
 * content and returns the raw text response. Callers that need structured
 * output should instruct the agent (in the system prompt) to respond with
 * JSON only, then parse it with callClaudeJSON below.
 */
export async function callClaude(
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AgentUnavailableError();

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://aeo-geo-beta.vercel.app",
      "X-Title": "SEO/AEO/GEO Team Tool",
    },
    body: JSON.stringify({
      model: AGENT_MODEL,
      max_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) throw new Error("Agent model returned no text content");
  return text;
}

/**
 * Calls the agent model and parses the response as JSON. Strips markdown
 * code fences if the model wraps its JSON output in ```json ... ```.
 */
export async function callClaudeJSON<T>(
  systemPrompt: string,
  userContent: string
): Promise<T> {
  const text = await callClaude(systemPrompt, userContent);
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Agent response was not valid JSON: ${cleaned.slice(0, 200)}`);
  }
}
