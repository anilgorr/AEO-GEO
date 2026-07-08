const CLAUDE_MODEL = "claude-sonnet-4-5";

export class AgentUnavailableError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not configured — agents are unavailable.");
    this.name = "AgentUnavailableError";
  }
}

/**
 * Calls Claude with a system prompt + user content and returns the raw
 * text response. Callers that need structured output should instruct the
 * agent (in the system prompt) to respond with JSON only, then parse it.
 */
export async function callClaude(
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AgentUnavailableError();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.content
    ?.filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text)
    .join("\n");

  if (!text) throw new Error("Claude returned no text content");
  return text;
}

/**
 * Calls Claude and parses the response as JSON. Strips markdown code
 * fences if the model wraps its JSON output in ```json ... ```.
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
