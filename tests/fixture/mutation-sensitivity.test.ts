import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { runBenchmark } from "../../src/benchmark.ts";
import { listCaseIds } from "../../src/case/loadCase.ts";

test("all expected comprehension mutations are observed for every case", async () => {
  await runBenchmark({ source: "templates" });

  for (const caseId of await listCaseIds()) {
    for (const mutationId of ["omitted-evidence", "visual-diagram-error", "table-value-error"]) {
      const impact = JSON.parse(
        readFileSync(
          join(process.cwd(), "results", caseId, "mutations", mutationId, "mutation-impact.json"),
          "utf8",
        ),
      );
      assert.equal(impact.observed, true, `${caseId}/${mutationId} should be observed`);
      assert.ok(
        impact.observed_channels.includes("comprehension"),
        `${caseId}/${mutationId} should affect comprehension`,
      );
    }
  }
});
