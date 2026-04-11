#!/usr/bin/env node
// check-codebase.mjs — audits CODEBASE.md for drift against the actual filesystem.
//
// Converts filesystem paths to their "mention form" before comparing:
//   - app/(auth)/login/page.tsx   → /login  (URL route)
//   - app/api/ghl/sync/route.ts   → /api/ghl/sync  (URL route)
//   - components/FunnelSnapshot.tsx → FunnelSnapshot.tsx  (basename)
//   - lib/ghl/api.ts              → lib/ghl/api.ts  (relative path)
//
// Reports files on disk with no corresponding mention in CODEBASE.md.
// Does NOT try to auto-update (descriptions require human judgment) — just flags drift.
//
// Run manually: npm run check-codebase
// Also runs automatically as a git pre-commit hook.

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, basename } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const CODEBASE_MD = join(ROOT, "CODEBASE.md");
const md = readFileSync(CODEBASE_MD, "utf-8");

// ── Walk helper ────────────────────────────────────────────────────────────

function walk(dir, match, results = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return results; }
  for (const entry of entries) {
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, match, results);
    } else if (match(entry, full)) {
      results.push(relative(ROOT, full));
    }
  }
  return results;
}

// ── Collect actual files ───────────────────────────────────────────────────

const pages  = walk(join(ROOT, "app"), (name) => name === "page.tsx");
const routes = walk(join(ROOT, "app"), (name) => name === "route.ts");
const comps  = walk(join(ROOT, "components"), (name, full) =>
  (name.endsWith(".tsx") || name.endsWith(".ts")) && !full.includes("/ui/")
);
const libs   = walk(join(ROOT, "lib"), (name) =>
  name.endsWith(".ts") || name.endsWith(".tsx")
);

// ── Convert filesystem paths → mention forms ───────────────────────────────

// page.tsx: app/(group)/foo/bar/page.tsx → /foo/bar
function pageToRoute(p) {
  return p
    .replace(/^app/, "")
    .replace(/\/\([^)]+\)/g, "")   // strip route groups like (auth)
    .replace(/\/page\.tsx$/, "") || "/";
}

// route.ts: app/api/foo/bar/route.ts → /api/foo/bar
function routeToUrl(p) {
  return p
    .replace(/^app/, "")
    .replace(/\/route\.ts$/, "");
}

// components/Foo.tsx → "Foo.tsx" or "Foo"
function compToMention(p) {
  return basename(p, ".tsx");
}

// lib/foo/bar.ts → "lib/foo/bar.ts"
function libToMention(p) {
  return p; // keep as-is; CODEBASE.md references lib files by relative path
}

// ── Check each file against CODEBASE.md ───────────────────────────────────

function mentioned(needle) {
  return md.includes(needle);
}

const missing = [];

for (const p of pages) {
  const route = pageToRoute(p);
  if (!mentioned(route) && !mentioned(p)) missing.push({ file: p, looking: route });
}

for (const p of routes) {
  const url = routeToUrl(p);
  if (!mentioned(url) && !mentioned(p)) missing.push({ file: p, looking: url });
}

for (const p of comps) {
  const name = compToMention(p);
  if (!mentioned(name) && !mentioned(p)) missing.push({ file: p, looking: name });
}

for (const p of libs) {
  const ref = libToMention(p);
  if (!mentioned(ref) && !mentioned(basename(p, ".ts"))) missing.push({ file: p, looking: ref });
}

// ── Output ─────────────────────────────────────────────────────────────────

if (missing.length === 0) {
  console.log("✓ CODEBASE.md is up to date.");
  process.exit(0);
}

console.log("\n⚠️  Files on disk not mentioned in CODEBASE.md:\n");
for (const { file, looking } of missing) {
  console.log(`  + ${file}  (looked for: "${looking}")`);
}
console.log("\nAdd these to CODEBASE.md before committing.\n");
process.exit(1);
