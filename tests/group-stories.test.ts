import test from "node:test";
import assert from "node:assert/strict";
import { groupByStory, mergeStoryPage } from "../src/lib/group-stories";
import type { Article } from "../src/lib/types";

function article(slug: string, storyGroup: string | null = null): Article {
  return {
    slug,
    title: slug,
    sourceUrl: `https://example.com/${slug}`,
    sourceDomain: "example.com",
    summary: `${slug} summary`,
    category: "Tech",
    feed: "tech",
    date: "2026-11-23",
    readingTime: 2,
    clipped: true,
    library: false,
    savedAt: null,
    relevanceScore: 50,
    storyGroup,
    createdAt: "2026-11-23T00:00:00.000Z",
    sourceId: slug,
    updatedAt: null,
    read: false,
  };
}

test("groupByStory keeps input order and attaches duplicate coverage", () => {
  const first = article("first", "group-a");
  const independent = article("independent");
  const second = article("second", "group-a");
  const grouped = groupByStory([first, independent, second]);

  assert.deepEqual(grouped.map((item) => item.slug), ["first", "independent"]);
  assert.deepEqual(grouped[0].relatedArticles?.map((item) => item.slug), ["second"]);
  assert.equal(grouped[1].relatedArticles, undefined);
});

test("mergeStoryPage folds later coverage into an existing story", () => {
  const existing = groupByStory([article("first", "group-a")]);
  const incoming = groupByStory([
    article("second", "group-a"),
    article("third", "group-b"),
  ]);
  const merged = mergeStoryPage(existing, incoming);

  assert.deepEqual(merged.map((item) => item.slug), ["first", "third"]);
  assert.deepEqual(merged[0].relatedArticles?.map((item) => item.slug), ["second"]);
});

test("mergeStoryPage ignores a slug already shown as related coverage", () => {
  const existing = groupByStory([
    article("first", "group-a"),
    article("second", "group-a"),
  ]);
  const merged = mergeStoryPage(existing, [article("second", "group-a")]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].relatedArticles?.length, 1);
});
