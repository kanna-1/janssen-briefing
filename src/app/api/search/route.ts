import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/db/queries";
import type { FeedType, SearchSortMode } from "@/lib/types";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 40;
const VALID_FEEDS = new Set<FeedType | "all">([
  "all",
  "singapore",
  "world",
  "asia",
  "finance",
  "ai",
  "tech",
  "library",
]);
const VALID_SORTS = new Set<SearchSortMode>(["relevance", "date-desc", "date-asc"]);

/** Postgres rejects a negative LIMIT/OFFSET outright, so clamp before querying. */
function positiveInt(raw: string | null, fallback: number, max?: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return max === undefined ? parsed : Math.min(parsed, max);
}

function validDate(raw: string | null): string | undefined {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const parsed = new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === raw
    ? raw
    : undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const query = searchParams.get("q") || "";
  const rawFeed = searchParams.get("feed") as FeedType | "all" | null;
  const rawSort = searchParams.get("sort") as SearchSortMode | null;
  const feed = rawFeed && VALID_FEEDS.has(rawFeed) ? rawFeed : undefined;
  const from = validDate(searchParams.get("from"));
  const to = validDate(searchParams.get("to"));
  const sort = rawSort && VALID_SORTS.has(rawSort) ? rawSort : "relevance";
  const limit = positiveInt(searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);
  const offset = positiveInt(searchParams.get("offset"), 0);

  const result = await searchArticles({
    query,
    feed,
    from,
    to,
    sort,
    limit,
    offset,
  });

  return NextResponse.json(result);
}
