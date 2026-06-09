import { existsSync } from "node:fs";
import { cp } from "node:fs/promises";
import { join } from "node:path";

import type { CorpusManifest, FormatId } from "../types.ts";
import { readJson } from "../core/fs.ts";
import { loadCanonicalCase } from "../case/loadCase.ts";
import { writeRichCorpus } from "./richCorpus.ts";

const KNOWN_FORMATS = new Set<FormatId>([
  "markdown",
  "html-static",
  "html-svg",
  "html-interactive",
  "json-renderer",
  "notebook",
]);

export async function loadCorpusRun(root: string): Promise<CorpusManifest> {
  const manifest = await readJson<CorpusManifest>(join(root, "manifest.json"));
  if (manifest.source !== "agent-authored-corpus") {
    throw new Error(`invalid corpus source: ${manifest.source}`);
  }
  for (const [format, file] of Object.entries(manifest.formats)) {
    if (!KNOWN_FORMATS.has(format as FormatId)) {
      throw new Error(`unknown corpus format: ${format}`);
    }
    if (!existsSync(join(root, file))) {
      throw new Error(`missing corpus file for ${format}: ${file}`);
    }
  }
  return manifest;
}

export async function copyCorpusRun(
  caseId: string,
  runId: string,
  outDir: string,
): Promise<CorpusManifest> {
  const sourceRoot = join(process.cwd(), "agent-corpus", caseId, runId);
  if (!existsSync(sourceRoot)) {
    return writeRichCorpus(await loadCanonicalCase(caseId), outDir);
  }
  const manifest = await loadCorpusRun(sourceRoot);
  await cp(sourceRoot, outDir, { recursive: true });
  return manifest;
}
