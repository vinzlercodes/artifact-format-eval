import assert from "node:assert/strict";
import test from "node:test";

import { MUTATIONS, applyMutation } from "../../src/mutate/mutations.ts";

const baseCase = {
  case_id: "prior-auth-001",
  schema_version: "0.1.0",
  artifact_type: "prior_auth_case_summary",
  patient: { age: 47, sex: "F" as const },
  status: "additional_info_requested",
  summary: "MRI lumbar spine requires prior authorization.",
  required_documentation_count: 3,
  evidence: [{ id: "ev-001", title: "Policy rule", included: true }],
  sections: [],
  diagram: { edges: [{ from: "clinician", to: "payer", label: "submits request" }] },
  risks: [],
  questions: [],
};

test("mutation registry contains the six MVP mutations", () => {
  assert.deepEqual(MUTATIONS.map((mutation) => mutation.id).sort(), [
    "accessibility-error",
    "factual-status-error",
    "omitted-evidence",
    "security-error",
    "table-value-error",
    "visual-diagram-error",
  ]);
});

test("table-value-error changes the documentation count without mutating the source", () => {
  const mutated = applyMutation(baseCase, "table-value-error");

  assert.equal(baseCase.required_documentation_count, 3);
  assert.equal(mutated.required_documentation_count, 2);
  assert.equal(mutated.mutation?.id, "table-value-error");
});
