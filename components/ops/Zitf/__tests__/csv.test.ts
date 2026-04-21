/**
 * Formula-injection coverage for the ZITF CSV exporter.
 *
 * Runs under any plain ES test runner (node --test, vitest, jest). No
 * framework-specific imports so the file stays portable.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { escapeCell } from "../csv-escape.ts";

test("escapeCell neutralises =HYPERLINK", () => {
  const out = escapeCell("=HYPERLINK(\"https://evil.example\", \"click\")");
  assert.ok(out.startsWith("\""));
  assert.ok(out.includes("'=HYPERLINK"));
});

test("escapeCell neutralises +cmd", () => {
  const out = escapeCell("+cmd|'/c calc'!A0");
  assert.ok(out.startsWith("'+"));
});

test("escapeCell neutralises -2+3", () => {
  const out = escapeCell("-2+3");
  assert.equal(out, "'-2+3");
});

test("escapeCell neutralises @SUM", () => {
  const out = escapeCell("@SUM(A1)");
  assert.ok(out.startsWith("'@"));
});

test("escapeCell neutralises TAB / CR prefixes", () => {
  assert.equal(escapeCell("\tfoo").startsWith("'"), true);
  // CR ends up quoted because of the RFC 4180 rule + the CR prefix rule.
  assert.ok(escapeCell("\rbar").includes("'\r"));
});

test("escapeCell leaves ordinary strings alone", () => {
  assert.equal(escapeCell("Hello world"), "Hello world");
  assert.equal(escapeCell("cafe"), "cafe");
  assert.equal(escapeCell(42), "42");
  assert.equal(escapeCell(true), "yes");
  assert.equal(escapeCell(null), "");
});

test("escapeCell RFC 4180 quotes commas and quotes", () => {
  assert.equal(escapeCell("a,b"), "\"a,b\"");
  assert.equal(escapeCell("she said \"hi\""), "\"she said \"\"hi\"\"\"");
});
