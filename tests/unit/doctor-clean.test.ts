import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { cleanGenerated } from "../../src/clean.ts";
import { runDoctor } from "../../src/doctor.ts";

test("runDoctor reports local tool availability without requiring API keys", async () => {
  const result = await runDoctor({ ci: true });

  assert.equal(result.apiKeysRequired, false);
  assert.ok(result.checks.some((check) => check.id === "node"));
  assert.ok(result.checks.some((check) => check.id === "pnpm"));
  assert.ok(result.checks.some((check) => check.id === "uv"));
});

test("cleanGenerated removes generated output directories", async () => {
  mkdirSync(join(process.cwd(), "results"), { recursive: true });
  mkdirSync(join(process.cwd(), "site-dist"), { recursive: true });

  await cleanGenerated();

  assert.equal(existsSync(join(process.cwd(), "results")), false);
  assert.equal(existsSync(join(process.cwd(), "site-dist")), false);
});
