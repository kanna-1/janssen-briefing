import { NextRequest } from "next/server";
import { buildGlobalSystemPrompt } from "@/lib/chat";
import { askTools, executeAskTool } from "@/lib/ask-tools";
import { getCorpusCoverage } from "@/lib/db/queries";
import {
  OPENROUTER_API_KEY,
  normaliseChatHistory,
  streamOpenRouterChat,
  type OpenRouterMessage,
  type OpenRouterTool,
} from "@/lib/openrouter";
import { limitRequest, rejectOversizedBody, requireTrustedMutation } from "@/lib/request-security";

const MAX_TURNS = 3;
const MAX_TOOL_CALLS = 4;

export const maxDuration = 120;

const archiveTools: OpenRouterTool[] = askTools.map((tool) => ({
  type: "function",
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters as Record<string, unknown>,
  },
}));

export async function POST(request: NextRequest) {
  const rejected =
    requireTrustedMutation(request) ??
    rejectOversizedBody(request, 128_000) ??
    limitRequest(request, "ask", 10, 60_000);
  if (rejected) return rejected;

  if (!OPENROUTER_API_KEY) {
    return Response.json(
      { error: "Ask is not configured. Add OPENROUTER_API_KEY to the deployment." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const history = normaliseChatHistory(body?.messages);
  if (history.length === 0) {
    return Response.json({ error: "Missing messages" }, { status: 400 });
  }

  const coverage = await getCorpusCoverage();
  const messages: OpenRouterMessage[] = [
    { role: "system", content: buildGlobalSystemPrompt(coverage ?? undefined) },
    ...history,
  ];
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

      const sentArticles = new Set<string>();
      const toolResults = new Map<string, Awaited<ReturnType<typeof executeAskTool>>>();
      let toolCalls = 0;

      try {
        let answered = false;

        for (let turn = 0; turn < MAX_TURNS; turn++) {
          const toolsAllowed = toolCalls < MAX_TOOL_CALLS;
          const reply = await streamOpenRouterChat({
            messages,
            tools: archiveTools,
            toolChoice: toolsAllowed ? "auto" : "none",
            onText: toolsAllowed ? undefined : (text) => send({ text }),
          });
          const calls = reply.tool_calls ?? [];

          if (calls.length === 0) {
            if (toolsAllowed && reply.content) send({ text: reply.content });
            answered = true;
            break;
          }

          messages.push(reply);
          for (const call of calls) {
            const key = `${call.function.name}:${call.function.arguments}`;
            const cached = toolResults.get(key);
            const withinBudget = Boolean(cached) || toolCalls < MAX_TOOL_CALLS;
            const result = withinBudget
              ? cached ??
                (await executeAskTool(call.function.name, call.function.arguments || "{}"))
              : {
                  output: "Tool budget reached. Answer using the results already gathered.",
                  detail: "tool budget reached",
                };

            if (!cached && withinBudget) {
              toolResults.set(key, result);
              toolCalls++;
              const fresh = (result.articles ?? []).filter(
                (article) => !sentArticles.has(article.slug)
              );
              for (const article of fresh) sentArticles.add(article.slug);
              send({
                step: { tool: call.function.name, detail: result.detail },
                ...(fresh.length ? { articles: fresh } : {}),
              });
            }

            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: result.output,
            });
          }
        }

        if (!answered) {
          await streamOpenRouterChat({
            messages,
            tools: archiveTools,
            toolChoice: "none",
            onText: (text) => send({ text }),
          });
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[ask] Stream error:", message);
        send({ error: message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
