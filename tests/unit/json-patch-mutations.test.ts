import assert from "node:assert/strict";
import test from "node:test";

import type { CanonicalCase } from "../../src/types.ts";
import { applyJsonPatch } from "../../src/mutate/mutations.ts";

test("applyJsonPatch supports RFC6902-style replace operations", () => {
  const source = {
    facts: {
      authorization_status: {
        value: "additional_info_requested",
      },
    },
  } as unknown as CanonicalCase;

  const mutated = applyJsonPatch(source, [
    { op: "replace", path: "/facts/authorization_status/value", value: "approved" },
  ]);

  assert.equal(source.facts?.authorization_status.value, "additional_info_requested");
  assert.equal(mutated.facts?.authorization_status.value, "approved");
});
