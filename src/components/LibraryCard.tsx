"use client";

import Link from "next/link";
import type { Article } from "@/lib/types";
import { feedColor } from "./article-shared";
import { toDateStr } from "./ArticleTimeline";

/**
 * The day it was added to the library, as the `YYYY-MM-DD` the rest of the app
 * writes dates in.
 *
 * `saved_at`, not `date`: `date` is the day the story was published and could be
 * weeks before the reader kept it. Labelling that one "Saved on" would be a
 * plain lie, and it is the case this label exists to describe.
 *
 * Read in the viewer's own timezone rather than the archive's Singapore day:
 * this records something the reader did, so their clock is the right one.
 */
function savedOn(article: Article): string {
  return article.savedAt ? toDateStr(new Date(article.savedAt)) : article.date;
}

const CARD_SHELL = "relative flex flex-col rounded-lg p-5 h-[220px] overflow-hidden";

/** The same, for the list view's shorter shell. */
const ROW_SHELL = "relative flex rounded-lg px-5 py-3.5 overflow-hidden";

interface LibraryCardProps {
  article: Article;
  menuTrigger?: React.ReactNode;
}

/**
 * A saved article in the feed's card language, with its saved date replacing
 * the relevance score used to rank the daily feed.
 */
export function LibraryCard({ article, menuTrigger }: LibraryCardProps) {
  return (
    <Link
      href={`/article/${article.slug}`}
      className={`${CARD_SHELL} bg-background border-2 border-border hover:border-accent/40 transition-colors group`}
    >
      <div className="absolute top-4 right-4 flex items-center gap-1">{menuTrigger}</div>

      <div className="flex items-center gap-2 text-xs text-muted mb-2 pr-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${article.sourceDomain}&sz=16`}
          alt=""
          width={14}
          height={14}
          className="rounded-sm"
        />
        <span className="truncate">{article.sourceDomain}</span>
        <span className="hidden md:inline">&middot;</span>
        <span className="hidden md:inline">Saved on {savedOn(article)}</span>
      </div>

      <h2 className="font-serif text-lg font-medium leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2 min-h-[2lh]">
        {article.title}
      </h2>

      <p className="text-sm text-muted leading-relaxed line-clamp-3">{article.summary}</p>

      {/* Same three-slot footer as `ArticleCard`, tag included. The tag is
          redundant on this page, but a clip found through search renders in
          that card and carries it — so dropping it here would make one article
          look like two different things depending on where it was found. */}
      <div className="flex items-center mt-auto pt-3">
        <span
          className={`flex-1 text-xs font-medium uppercase tracking-wider ${
            feedColor[article.feed] || "text-muted"
          }`}
        >
          {article.feed}
        </span>
        <span className="flex-1" />
        <span className="flex-1 text-right">
          {!article.clipped && (
            <span className="text-[12px] italic text-muted">*link only</span>
          )}
        </span>
      </div>
    </Link>
  );
}

/**
 * The list-view form of {@link LibraryCard}.
 *
 * Mirrors `ArticleRow` in shape and spacing so switching views on either page
 * lands somewhere familiar, minus the parts a clip has no answer for — the
 * relevance score, the feed tag, and the source switcher, which needs a story
 * group a clip never has.
 */
export function LibraryRow({ article, menuTrigger }: LibraryCardProps) {
  return (
    <Link
      href={`/article/${article.slug}`}
      className={`${ROW_SHELL} flex-col bg-background border-2 border-border hover:border-accent/40 transition-colors group`}
    >
      <div className="absolute top-3 right-4 flex items-center gap-1">{menuTrigger}</div>

      <h2 className="font-serif text-base font-medium leading-snug group-hover:text-accent transition-colors truncate pr-8">
        {article.title}
      </h2>

      <div className="flex items-center gap-2 mt-1 text-xs text-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${article.sourceDomain}&sz=16`}
          alt=""
          width={14}
          height={14}
          className="rounded-sm shrink-0"
        />
        <span className="truncate">{article.sourceDomain}</span>
        <span>&middot;</span>
        <span
          className={`shrink-0 uppercase tracking-wider font-medium ${
            feedColor[article.feed] || "text-muted"
          }`}
        >
          {article.feed}
        </span>
        <span>&middot;</span>
        <span className="shrink-0">Saved on {savedOn(article)}</span>
        {!article.clipped && (
          <span className="ml-auto shrink-0 text-[12px] italic">*link only</span>
        )}
      </div>
    </Link>
  );
}
