import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { runBenchmark } from "../../src/benchmark.ts";

test("runBenchmark can evaluate agent corpus source separately", async () => {
  await runBenchmark({ caseId: "prior-auth", source: "agent-corpus" });

  const root = join(process.cwd(), "results", "prior-auth", "agent-corpus", "codex-rich");
  assert.ok(existsSync(join(root, "scores.by-format.json")));
  assert.ok(existsSync(join(root, "artifact-interactive.html")));

  const scores = JSON.parse(readFileSync(join(root, "scores.by-format.json"), "utf8"));
  assert.equal(scores.source, "agent-corpus");
  assert.equal(scores.case_id, "prior-auth");
  assert.ok(scores.formats["html-interactive"].metrics.comprehension >= scores.formats.markdown.metrics.comprehension);
});

test("default benchmark writes template and corpus groups into report", async () => {
  await runBenchmark({ caseId: "prior-auth" });

  assert.ok(existsSync(join(process.cwd(), "results", "prior-auth", "baseline", "scores.by-format.json")));
  assert.ok(existsSync(join(process.cwd(), "results", "prior-auth", "agent-corpus", "codex-rich", "scores.by-format.json")));

  const report = readFileSync(join(process.cwd(), "site-dist", "index.html"), "utf8");
  assert.match(report, /templates/);
  assert.match(report, /agent-corpus/);
  assert.match(report, /Where HTML helped/);
});
