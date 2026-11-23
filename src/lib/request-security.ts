import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

function equalSecret(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function hasMaintenanceAuthorization(headers: Headers, secret?: string): boolean {
  if (!secret) return false;
  const authorization = headers.get("authorization") ?? "";
  return equalSecret(authorization, `Bearer ${secret}`);
}

export function isSameOriginRequest(headers: Headers, requestUrl: string): boolean {
  const expected = new URL(requestUrl).origin;
  const origin = headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin === expected;
    } catch {
      return false;
    }
  }

  const referer = headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === expected;
    } catch {
      return false;
    }
  }

  return headers.get("sec-fetch-site") === "same-origin";
}

/** Protect browser writes from cross-site requests while still allowing cron tooling. */
export function requireTrustedMutation(request: NextRequest): NextResponse | null {
  if (
    hasMaintenanceAuthorization(request.headers, process.env.CRON_SECRET) ||
    isSameOriginRequest(request.headers, request.url)
  ) {
    return null;
  }

  return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
}

/** Maintenance routes are not part of the public browser product. */
export function requireMaintenanceAuthorization(request: NextRequest): NextResponse | null {
  if (hasMaintenanceAuthorization(request.headers, process.env.CRON_SECRET)) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function consumeFixedWindow(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): { allowed: boolean; remaining: number; resetAt: number } {
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;

  bucket.count += 1;
  buckets.set(key, bucket);

  // Bound memory in long-running containers. Serverless instances naturally
  // discard this map, while a large map here means many expired client keys.
  if (buckets.size > 5_000) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(limit - bucket.count, 0),
    resetAt: bucket.resetAt,
  };
}

function clientAddress(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function limitRequest(
  request: NextRequest,
  namespace: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const result = consumeFixedWindow(`${namespace}:${clientAddress(request)}`, limit, windowMs);
  if (result.allowed) return null;

  const retryAfter = Math.max(Math.ceil((result.resetAt - Date.now()) / 1_000), 1);
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

export function rejectOversizedBody(request: NextRequest, maxBytes: number): NextResponse | null {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > maxBytes) {
    return NextResponse.json({ error: "Request body is too large" }, { status: 413 });
  }
  return null;
}
