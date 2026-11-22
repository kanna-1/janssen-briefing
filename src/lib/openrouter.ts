export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

const DEFAULT_MAX_TOKENS = 900;
const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4_000;

export interface OpenRouterToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: OpenRouterToolCall[];
  tool_call_id?: string;
}

export interface OpenRouterTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

interface ChatDelta {
  content?: string;
  tool_calls?: Array<{
    index: number;
    id?: string;
    function?: { name?: string; arguments?: string };
  }>;
}

/** Keep browser-supplied history bounded before it reaches a model context. */
export function normaliseChatHistory(input: unknown): OpenRouterMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .flatMap((message): OpenRouterMessage[] => {
      if (!message || typeof message !== "object") return [];
      const row = message as Record<string, unknown>;
      if (row.role !== "user" && row.role !== "assistant") return [];
      if (typeof row.content !== "string" || !row.content.trim()) return [];
      return [{ role: row.role, content: row.content.slice(0, MAX_MESSAGE_CHARS) }];
    })
    .slice(-MAX_HISTORY_MESSAGES);
}

export async function streamOpenRouterChat(options: {
  messages: OpenRouterMessage[];
  tools?: OpenRouterTool[];
  toolChoice?: "auto" | "none";
  maxTokens?: number;
  onText?: (text: string) => void;
}): Promise<OpenRouterMessage> {
  if (!OPENROUTER_API_KEY) throw new Error("OpenRouter is not configured");

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://janssen-briefing.vercel.app",
      "X-Title": "Janssen's Briefing",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: options.messages,
      stream: true,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: 0.2,
      ...(options.tools?.length
        ? { tools: options.tools, tool_choice: options.toolChoice ?? "auto" }
        : {}),
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[openrouter] API error ${response.status}: ${detail.slice(0, 500)}`);
    throw new Error(`OpenRouter request failed (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("OpenRouter returned no response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  const calls = new Map<number, OpenRouterToolCall>();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (!data || data === "[DONE]") continue;

      let parsed: {
        error?: { message?: string };
        choices?: Array<{ delta?: ChatDelta }>;
      };
      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }

      if (parsed.error) throw new Error(parsed.error.message || "OpenRouter model failed");
      const delta = parsed.choices?.[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        content += delta.content;
        options.onText?.(delta.content);
      }

      for (const part of delta.tool_calls ?? []) {
        const current = calls.get(part.index) ?? {
          id: part.id ?? `call_${part.index}`,
          type: "function" as const,
          function: { name: "", arguments: "" },
        };
        if (part.id) current.id = part.id;
        if (part.function?.name) current.function.name += part.function.name;
        if (part.function?.arguments) current.function.arguments += part.function.arguments;
        calls.set(part.index, current);
      }
    }
  }

  const toolCalls = [...calls.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, call]) => call)
    .filter((call) => call.function.name);

  return {
    role: "assistant",
    content: content || null,
    ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
  };
}
