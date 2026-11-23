import test from "node:test";
import assert from "node:assert/strict";
import { fallbackTitle, MAX_TITLE_LENGTH } from "../src/lib/conversation-title";
import { sanitiseMessages } from "../src/lib/conversations";
import { FEED_SOURCES, NEWS_FEEDS, groupSourcesByFeed, resolveFeedSources } from "../src/lib/feed-sources";
import type { ChatMessage } from "../src/lib/types";

test("fallbackTitle normalizes whitespace and truncates at a useful word boundary", () => {
  const short: ChatMessage[] = [{ id: "1", role: "user", content: "  API   design basics  " }];
  assert.equal(fallbackTitle(short), "API design basics");

  const long: ChatMessage[] = [{ id: "1", role: "user", content: "How should a production news application validate and process many different RSS feeds safely?" }];
  const title = fallbackTitle(long);
  assert.ok(title.length <= MAX_TITLE_LENGTH);
  assert.ok(title.endsWith("…"));
  assert.equal(title.includes("  "), false);
});

test("sanitiseMessages rejects unusable input and strips unknown fields", () => {
  assert.equal(sanitiseMessages(null), null);
  assert.equal(sanitiseMessages([]), null);

  const result = sanitiseMessages([
    { id: "m1", role: "user", content: "hello", injected: "drop me" },
    { role: "assistant", content: "missing id" },
    { id: "m2", role: "tool", content: "invalid role" },
  ]);
  assert.deepEqual(result, [{ id: "m1", role: "user", content: "hello" }]);
  assert.equal("injected" in (result?.[0] ?? {}), false);
});

test("sanitiseMessages validates nested archive evidence", () => {
  const result = sanitiseMessages([
    {
      id: "m1",
      role: "assistant",
      content: "answer",
      steps: [
        { tool: "search_articles", detail: "AI - 2 articles" },
        { tool: "delete_article", detail: "not allowed" },
      ],
      articles: [
        { slug: "story", title: "Story", summary: "Summary", date: "2026-11-23", sourceDomain: "example.com", feed: "ai", alsoReportedBy: ["CNA"] },
        { title: "missing slug" },
      ],
      sources: [{ title: "Source", url: "/article/story" }, { title: "bad" }],
    },
  ]);
  assert.equal(result?.[0].steps?.length, 1);
  assert.equal(result?.[0].articles?.length, 1);
  assert.equal(result?.[0].sources?.length, 1);
});

test("source registry has unique ids and coverage for every news section", () => {
  assert.equal(FEED_SOURCES.length, 20);
  assert.equal(new Set(FEED_SOURCES.map((source) => source.id)).size, FEED_SOURCES.length);
  for (const { value } of NEWS_FEEDS) {
    assert.ok(FEED_SOURCES.some((source) => source.feed === value), value);
  }
});

test("source overrides are sparse and grouped in navigation order", () => {
  const sources = resolveFeedSources(new Map([["guardian-ai", false]]));
  assert.equal(sources.find((source) => source.id === "guardian-ai")?.enabled, false);
  assert.equal(sources.find((source) => source.id === "guardian-tech")?.enabled, true);
  assert.deepEqual(groupSourcesByFeed(sources).map((group) => group.feed), NEWS_FEEDS.map((feed) => feed.value));
});
