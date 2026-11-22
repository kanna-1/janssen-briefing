"use client";

import { useMemo, useState } from "react";
import { ListBox, ListBoxItem, Select } from "@heroui/react";
import { useLibrary } from "@/hooks/useLibrary";
import { LibraryGrid } from "@/components/LibraryGrid";
import { SearchInput, ViewToggle } from "@/components/FeedFilter";
import type { ViewMode } from "@/components/ArticleGrid";
import { LIBRARY_VIEW_COOKIE } from "@/lib/view-cookie";
import { useViewMode } from "@/hooks/useViewMode";

type LibrarySort = "saved" | "published";

export function LibraryPage({ initialView = "grid" }: { initialView?: ViewMode }) {
  const { articles, search, setSearch, loading, error, removeArticle } = useLibrary();
  const [view, handleViewChange] = useViewMode(LIBRARY_VIEW_COOKIE, initialView);
  const [sort, setSort] = useState<LibrarySort>("saved");

  const visibleArticles = useMemo(() => {
    if (sort === "published") {
      return [...articles].sort((a, b) => b.date.localeCompare(a.date));
    }
    return articles;
  }, [articles, sort]);

  const searching = search.trim().length > 0;
  const isEmpty = !loading && visibleArticles.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-24 md:pb-28">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-medium shrink-0">Library</h1>
        <span className="text-xs text-muted shrink-0">
          {visibleArticles.length} {visibleArticles.length === 1 ? "article" : "articles"}
          {searching && " found"}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search your library..."
          aria-label="Search your library"
        />
        <Select
          aria-label="Sort library"
          selectedKey={sort}
          onSelectionChange={(key) => setSort(key as LibrarySort)}
        >
          <Select.Trigger className="min-w-[128px]">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBoxItem id="saved" textValue="Recently saved">Recently saved</ListBoxItem>
              <ListBoxItem id="published" textValue="Newest published">Newest published</ListBoxItem>
            </ListBox>
          </Select.Popover>
        </Select>
        <ViewToggle view={view} onViewChange={handleViewChange} />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {isEmpty ? (
        <div className="text-center py-16">
          {searching ? (
            <>
              <p className="font-serif text-lg mb-2">Nothing matches that</p>
              <p className="text-sm text-muted max-w-sm mx-auto">
                Search checks saved article titles, summaries, text, and sources.
              </p>
            </>
          ) : (
            <>
              <p className="font-serif text-lg mb-2">No saved articles yet</p>
              <p className="text-sm text-muted max-w-sm mx-auto">
                Open an article menu, or right-click a feed article, and choose Save to library.
              </p>
            </>
          )}
        </div>
      ) : (
        <LibraryGrid
          articles={visibleArticles}
          loading={loading}
          view={view}
          onRemove={removeArticle}
        />
      )}
    </div>
  );
}
