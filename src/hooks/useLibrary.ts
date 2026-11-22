"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "@heroui/react";
import type { Article } from "@/lib/types";

interface LibraryData {
  articles: Article[];
}

const fetcher = async (url: string): Promise<LibraryData> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to load your library");
  return response.json();
};

export function useLibrary() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const swrKey = debouncedSearch.trim()
    ? `/api/library?search=${encodeURIComponent(debouncedSearch.trim())}`
    : "/api/library";

  const { data, error, isLoading, mutate } = useSWR<LibraryData>(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
    keepPreviousData: true,
  });

  const removeArticle = useCallback(
    (slug: string) =>
      fetch("/api/library", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
        .then(() => {
          mutate(
            (current) => ({
              articles: (current?.articles ?? []).filter((article) => article.slug !== slug),
            }),
            { revalidate: false }
          );
          toast.success("Removed from library");
        })
        .catch((err) => {
          console.error("[library] remove failed:", err);
          toast.danger("Couldn't remove that article");
          throw err;
        }),
    [mutate]
  );

  return {
    articles: data?.articles ?? [],
    search,
    setSearch,
    searching: search.trim() !== debouncedSearch.trim(),
    loading: isLoading,
    error: error ? (error as Error).message : null,
    removeArticle,
  };
}
