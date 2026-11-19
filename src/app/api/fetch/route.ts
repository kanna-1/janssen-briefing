import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.ENABLE_PIPELINE === "false") {
    return NextResponse.json({ error: "Pipeline disabled" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const { getOrStartFetchPipeline } = await import("@/lib/pipeline");
    // Joins a scheduled run already in flight rather than scraping twice.
    const { result, finalize } = await getOrStartFetchPipeline({ date: body.date });
    await finalize();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/fetch] Pipeline error:", error);
    return NextResponse.json(
      { error: "Pipeline failed" },
      { status: 500 }
    );
  }
}
