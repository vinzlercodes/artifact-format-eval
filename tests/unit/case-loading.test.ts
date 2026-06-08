import assert from "node:assert/strict";
import test from "node:test";

import { listCaseIds, loadBenchmarkCase } from "../../src/case/loadCase.ts";

test("listCaseIds includes the five coverage fixtures", async () => {
  assert.deepEqual((await listCaseIds()).sort(), [
    "code-review",
    "dashboard-editor",
    "incident-report",
    "prior-auth",
    "research-explainer",
  ]);
});

test("loadBenchmarkCase loads canonical data, questions, and mutations", async () => {
  const benchmarkCase = await loadBenchmarkCase("prior-auth");

  assert.equal(benchmarkCase.caseId, "prior-auth");
  assert.equal(benchmarkCase.canonical.case_id, "prior-auth-001");
  assert.equal(benchmarkCase.questions.length, 5);
  assert.equal(benchmarkCase.mutations.length, 6);
  assert.ok(benchmarkCase.mutations.every((mutation) => Array.isArray(mutation.patch)));
});
