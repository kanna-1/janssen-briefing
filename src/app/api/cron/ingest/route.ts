import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.ENABLE_PIPELINE === "false") {
    return NextResponse.json(
      { error: "Pipeline disabled" },
      { status: 503 }
    );
  }

  try {
    const { getOrStartFetchPipeline } = await import("@/lib/pipeline");
    const { result, finalize } = await getOrStartFetchPipeline();
    await finalize();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[cron/ingest] Pipeline error:", error);
    return NextResponse.json({ error: "Pipeline failed" }, { status: 500 });
  }
}
