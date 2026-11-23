import { NextRequest, NextResponse } from "next/server";
import { getArticleBySlug, getArticleContent } from "@/lib/db/queries";
import { buildSystemPrompt } from "@/lib/chat";
import {
  OPENROUTER_API_KEY,
  normaliseChatHistory,
  streamOpenRouterChat,
  type OpenRouterMessage,
} from "@/lib/openrouter";
import { limitRequest, rejectOversizedBody, requireTrustedMutation } from "@/lib/request-security";

export const maxDuration = 90;

export async function POST(request: NextRequest) {
  const rejected =
    requireTrustedMutation(request) ??
    rejectOversizedBody(request, 128_000) ??
    limitRequest(request, "article-chat", 15, 60_000);
  if (rejected) return rejected;

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "Chat is not configured. Add OPENROUTER_API_KEY to the deployment." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const history = normaliseChatHistory(body?.messages);
  if (!body?.slug || history.length === 0) {
    return NextResponse.json({ error: "Missing slug or messages" }, { status: 400 });
  }

  const article = await getArticleBySlug(body.slug);
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const markdown = (await getArticleContent(body.slug)) ?? article.summary;
  const messages: OpenRouterMessage[] = [
    { role: "system", content: buildSystemPrompt(markdown, article) },
    ...history,
  ];
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

      try {
        await streamOpenRouterChat({ messages, onText: (text) => send({ text }) });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[chat] Stream error:", message);
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
