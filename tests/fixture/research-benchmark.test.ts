import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { runBenchmark } from "../../src/benchmark.ts";
import { runReaderEvaluation } from "../../src/evaluate/evaluate.ts";

test("benchmark writes compact per-format scores and separate evidence files", async () => {
  await runBenchmark({ caseId: "prior-auth" });

  const baseline = join(process.cwd(), "results", "prior-auth", "baseline");
  for (const file of [
    "metrics.raw.by-format.json",
    "scores.by-format.json",
    "comprehension.by-format.json",
    "runtime.by-format.json",
    "evidence.by-format.json",
  ]) {
    assert.ok(existsSync(join(baseline, file)), `missing ${file}`);
  }

  const scores = JSON.parse(readFileSync(join(baseline, "scores.by-format.json"), "utf8"));
  assert.equal(scores.case_id, "prior-auth");
  assert.equal(scores.run_id, "baseline");
  assert.deepEqual(Object.keys(scores.formats).sort(), [
    "html-interactive",
    "html-static",
    "html-svg",
    "json-renderer",
    "markdown",
    "notebook",
  ]);

  const markdown = scores.formats.markdown;
  assert.deepEqual(Object.keys(markdown).sort(), ["metrics", "profiles"]);
  assert.ok(!("evidence" in markdown));
  assert.ok(!("runtime" in markdown));
  assert.ok(typeof markdown.metrics.comprehension === "number");
  assert.ok(typeof markdown.profiles.human_reviewer === "number");
});

test("reader evaluation is deterministic and evaluate:agent compatible", async () => {
  await runBenchmark({ caseId: "prior-auth" });
  await runReaderEvaluation("prior-auth");

  const comprehension = JSON.parse(
    readFileSync(join(process.cwd(), "results", "prior-auth", "baseline", "comprehension.by-format.json"), "utf8"),
  );
  assert.equal(comprehension.case_id, "prior-auth");
  assert.equal(comprehension.method, "deterministic-local-reader");
  assert.equal(comprehension.formats.markdown.questions.length, 5);
  assert.ok(comprehension.formats.markdown.accuracy > 0);
});

test("mutation impact is based on observed degradation, not manifest presence", async () => {
  await runBenchmark({ caseId: "prior-auth" });

  const impact = JSON.parse(
    readFileSync(
      join(process.cwd(), "results", "prior-auth", "mutations", "factual-status-error", "mutation-impact.json"),
      "utf8",
    ),
  );
  assert.equal(impact.mutation_id, "factual-status-error");
  assert.deepEqual(impact.affected_questions, ["q1"]);
  assert.equal(impact.observed, true);
  assert.ok(impact.observed_channels.includes("comprehension"));
  assert.ok(impact.by_format.markdown.affected_accuracy_delta < 0);
});

test("accessibility mutation lowers html-svg accessibility", async () => {
  await runBenchmark({ caseId: "prior-auth" });

  const scores = JSON.parse(
    readFileSync(
      join(process.cwd(), "results", "prior-auth", "mutations", "accessibility-error", "scores.by-format.json"),
      "utf8",
    ),
  );
  assert.ok(scores.formats["html-svg"].metrics.accessibility < 1);
});
