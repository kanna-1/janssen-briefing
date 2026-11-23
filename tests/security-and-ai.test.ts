import test from "node:test";
import assert from "node:assert/strict";
import { isBlockedHost } from "../src/lib/guarded-fetch";
import { normaliseChatHistory } from "../src/lib/openrouter";
import {
  estimateTokens,
  isDailyQuotaError,
  parseRetryDelayMs,
} from "../src/lib/rate-limit";
import {
  consumeFixedWindow,
  hasMaintenanceAuthorization,
  isSameOriginRequest,
} from "../src/lib/request-security";

test("SSRF guard blocks local, private, link-local, CGNAT, and mapped addresses", () => {
  const blocked = [
    "localhost",
    "api.localhost",
    "127.0.0.1",
    "10.0.0.1",
    "100.64.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "224.0.0.1",
    "::1",
    "fe80::1",
    "fc00::1",
    "::ffff:7f00:1",
    "service.internal",
  ];
  for (const host of blocked) assert.equal(isBlockedHost(host), true, host);
});

test("SSRF guard permits ordinary public hosts and addresses", () => {
  for (const host of ["example.com", "8.8.8.8", "100.63.255.255", "172.15.0.1"]) {
    assert.equal(isBlockedHost(host), false, host);
  }
});

test("chat history drops malformed messages and keeps only the newest twelve", () => {
  const input = [
    { role: "system", content: "ignore me" },
    ...Array.from({ length: 14 }, (_, index) => ({
      role: index % 2 ? "assistant" : "user",
      content: `message-${index}`,
    })),
    { role: "user", content: "   " },
  ];
  const normalized = normaliseChatHistory(input);
  assert.equal(normalized.length, 12);
  assert.equal(normalized[0].content, "message-2");
  assert.equal(normalized[11].content, "message-13");
});

test("chat history caps individual message size", () => {
  const normalized = normaliseChatHistory([{ role: "user", content: "x".repeat(5000) }]);
  assert.equal(normalized[0].content?.length, 4000);
});

test("Gemini quota helpers distinguish daily caps and bound retry delays", () => {
  const daily = {
    error: { details: [{ violations: [{ quotaId: "GenerateRequestsPerDay" }] }] },
  };
  assert.equal(isDailyQuotaError(daily), true);
  assert.equal(isDailyQuotaError({ error: { details: [] } }), false);
  assert.equal(parseRetryDelayMs({ error: { details: [{ retryDelay: "1.25s" }] } }, 5000, 3000), 1750);
  assert.equal(parseRetryDelayMs({}, 5000, 3000), 5000);
  assert.equal(estimateTokens("12345678"), 2);
});

test("mutation guard accepts same-origin requests and exact bearer credentials", () => {
  assert.equal(
    isSameOriginRequest(new Headers({ origin: "https://briefing.example" }), "https://briefing.example/api/library"),
    true
  );
  assert.equal(
    isSameOriginRequest(new Headers({ origin: "https://attacker.example" }), "https://briefing.example/api/library"),
    false
  );
  assert.equal(
    hasMaintenanceAuthorization(new Headers({ authorization: "Bearer correct" }), "correct"),
    true
  );
  assert.equal(
    hasMaintenanceAuthorization(new Headers({ authorization: "Bearer incorrect" }), "correct"),
    false
  );
});

test("fixed-window limiter resets cleanly and rejects excess calls", () => {
  const key = `test-${Math.random()}`;
  assert.equal(consumeFixedWindow(key, 2, 1_000, 10_000).allowed, true);
  assert.equal(consumeFixedWindow(key, 2, 1_000, 10_100).allowed, true);
  assert.equal(consumeFixedWindow(key, 2, 1_000, 10_200).allowed, false);
  assert.equal(consumeFixedWindow(key, 2, 1_000, 11_001).allowed, true);
});
