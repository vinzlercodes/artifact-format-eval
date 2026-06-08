import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { runBenchmark } from "../../src/benchmark.ts";

test("runBenchmark produces baseline artifacts, mutation variants, and scoring files", async () => {
  await runBenchmark({ caseId: "prior-auth" });

  const baseline = join(process.cwd(), "results", "prior-auth", "baseline");
  for (const file of [
    "artifact.md",
    "artifact.html",
    "artifact-svg.html",
    "artifact-interactive.html",
    "artifact.json",
    "artifact.ipynb",
    "artifact.meta.json",
    "scores.raw.json",
    "scores.normalized.json",
    "scores.by-profile.json",
  ]) {
    assert.ok(existsSync(join(baseline, file)), `missing ${file}`);
  }

  const html = readFileSync(join(baseline, "artifact.html"), "utf8");
  assert.match(html, /source_hash/);
  assert.doesNotMatch(html, /generated_at/);

  assert.ok(existsSync(join(process.cwd(), "results", "prior-auth", "mutations", "security-error", "mutation.manifest.json")));
  assert.ok(existsSync(join(process.cwd(), "site-dist", "index.html")));
});
