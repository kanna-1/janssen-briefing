import { NextRequest, NextResponse } from "next/server";
import {
  getLibraryArticles,
  getArticleBySlug,
  addToLibrary,
  removeFromLibrary,
} from "@/lib/db/queries";
import { LIBRARY_FEED } from "@/lib/types";
import { LOG_TITLE_LEN } from "@/lib/api-utils";
import { requireTrustedMutation } from "@/lib/request-security";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") || undefined;
  const articles = await getLibraryArticles({ search });
  return NextResponse.json({ articles });
}

/**
 * Save an existing feed article to the library.
 */
export async function POST(request: NextRequest) {
  const rejected = requireTrustedMutation(request);
  if (rejected) return rejected;

  const body = await request.json().catch(() => null);

  if (!body?.slug || typeof body.slug !== "string") {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const existing = await getArticleBySlug(body.slug);
  if (!existing || existing.feed === LIBRARY_FEED) {
    return NextResponse.json({ error: "Feed article not found" }, { status: 404 });
  }
  if (existing.library) {
    return NextResponse.json({ status: "duplicate", article: existing });
  }

  await addToLibrary(existing.slug);
  const saved = await getArticleBySlug(existing.slug);
  console.log(`[library] Saved from feed: ${existing.title.slice(0, LOG_TITLE_LEN)}`);
  return NextResponse.json({ status: "saved", article: saved ?? existing });
}

/**
 * Take an article out of the library.
 *
 * This clears library membership without deleting the article from its feed.
 */
export async function DELETE(request: NextRequest) {
  const rejected = requireTrustedMutation(request);
  if (rejected) return rejected;

  const body = await request.json().catch(() => null);

  if (!body?.slug || typeof body.slug !== "string") {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const article = await getArticleBySlug(body.slug);
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  await removeFromLibrary(article.slug);
  console.log(`[library] Unsaved ${article.title.slice(0, LOG_TITLE_LEN)}`);
  return NextResponse.json({ slug: article.slug });
}
