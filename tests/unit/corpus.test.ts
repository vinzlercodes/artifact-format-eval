import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { loadCorpusRun } from "../../src/corpus/loadCorpus.ts";

test("loadCorpusRun validates manifest format files", async () => {
  const root = join(process.cwd(), "results", "tmp-corpus-test");
  await mkdir(root, { recursive: true });
  await writeFile(
    join(root, "manifest.json"),
    JSON.stringify({
      case_id: "tmp-case",
      run_id: "codex-rich",
      source: "agent-authored-corpus",
      prompt: "Create a rich HTML artifact.",
      authoring_agent: "Codex",
      date_policy: "static fixture",
      formats: { markdown: "missing.md" },
    }),
  );

  await assert.rejects(loadCorpusRun(root), /missing corpus file/);
});
