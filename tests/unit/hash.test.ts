import assert from "node:assert/strict";
import test from "node:test";

import { canonicalHash, stableJson } from "../../src/core/hash.ts";

test("stableJson sorts object keys recursively", () => {
  const value = { z: 1, a: { y: 2, b: 3 }, list: [{ d: 4, c: 5 }] };

  assert.equal(stableJson(value), '{"a":{"b":3,"y":2},"list":[{"c":5,"d":4}],"z":1}');
});

test("canonicalHash is stable for equivalent objects", () => {
  const first = { b: 2, a: 1 };
  const second = { a: 1, b: 2 };

  assert.equal(canonicalHash(first), canonicalHash(second));
  assert.match(canonicalHash(first), /^sha256:[a-f0-9]{64}$/);
});
