import test from "node:test";
import assert from "node:assert/strict";
import { buildSwrKey, filtersFromParams, filtersToParams } from "../src/lib/feed-query";

test("feed query applies stable defaults", () => {
  assert.deepEqual(filtersFromParams(new URLSearchParams()), {
    feed: "all",
    date: undefined,
    search: undefined,
    sort: "relevance",
  });
});

test("feed query accepts known values and a real ISO date", () => {
  const filters = filtersFromParams(
    new URLSearchParams("feed=ai&date=2026-11-23&search=agents&sort=date-desc")
  );
  assert.deepEqual(filters, {
    feed: "ai",
    date: "2026-11-23",
    search: "agents",
    sort: "date-desc",
  });
});

test("feed query rejects impossible dates and unknown enums", () => {
  const filters = filtersFromParams(
    new URLSearchParams("feed=private&date=2026-02-30&sort=random")
  );
  assert.equal(filters.feed, "all");
  assert.equal(filters.date, undefined);
  assert.equal(filters.sort, "relevance");
});

test("filter serialization round-trips encoded search text", () => {
  const filters = {
    feed: "tech" as const,
    date: "2026-11-23",
    search: "AI & chips",
    sort: "date-asc" as const,
  };
  const serialized = filtersToParams(filters);
  assert.equal(serialized, "feed=tech&date=2026-11-23&search=AI+%26+chips&sort=date-asc");
  assert.equal(buildSwrKey(filters), `/api/articles?${serialized}`);
});
