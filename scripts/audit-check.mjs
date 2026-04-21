#!/usr/bin/env node
/**
 * Production npm audit wrapper.
 *
 * Runs `npm audit --omit=dev --json`, then fails on any `high`/`critical`
 * advisory that is NOT present in `.audit-waivers.json`. A waived advisory
 * must still be tracked in CHANGES.md with justification and a review date.
 *
 * Usage: node scripts/audit-check.mjs
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const BLOCKING_SEVERITIES = new Set(["high", "critical"]);

function loadWaivers() {
  const path = resolve(process.cwd(), ".audit-waivers.json");
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed.advisories) ? parsed.advisories : [];
    return new Set(entries.map((e) => e.id));
  } catch {
    return new Set();
  }
}

function runAudit() {
  const result = spawnSync(
    "npm",
    ["audit", "--omit=dev", "--json", "--audit-level=high"],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );
  if (!result.stdout) {
    console.error("npm audit produced no output");
    console.error(result.stderr);
    process.exit(2);
  }
  try {
    return JSON.parse(result.stdout);
  } catch (err) {
    console.error("Could not parse npm audit output as JSON", err);
    console.error(result.stdout);
    process.exit(2);
  }
}

function collectAdvisoryIds(via, out) {
  if (!Array.isArray(via)) return;
  for (const v of via) {
    if (typeof v === "object" && v && typeof v.url === "string") {
      const match = v.url.match(/(GHSA-[a-z0-9-]+)/i);
      if (match) out.add(match[1]);
    }
  }
}

function main() {
  const waivers = loadWaivers();
  const report = runAudit();
  const vulns = report.vulnerabilities ?? {};
  const unwaived = [];

  for (const [pkg, info] of Object.entries(vulns)) {
    if (!BLOCKING_SEVERITIES.has(info.severity)) continue;
    const ids = new Set();
    collectAdvisoryIds(info.via, ids);
    for (const id of ids) {
      if (!waivers.has(id)) {
        unwaived.push({ package: pkg, severity: info.severity, id });
      }
    }
  }

  if (unwaived.length > 0) {
    console.error("Un-waived high/critical advisories detected:");
    for (const row of unwaived) {
      console.error(`  - ${row.id} (${row.severity}) in ${row.package}`);
    }
    console.error(
      "\nAdd to .audit-waivers.json with justification, or upgrade the package.",
    );
    process.exit(1);
  }

  console.log(
    `npm audit clean: ${waivers.size} advisor${
      waivers.size === 1 ? "y" : "ies"
    } waived, none un-handled.`,
  );
}

main();
