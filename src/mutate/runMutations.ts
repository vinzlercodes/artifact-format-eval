import { join } from "node:path";

import { loadBenchmarkCase } from "../case/loadCase.ts";
import { writeJson } from "../core/fs.ts";
import { generateArtifacts } from "../generate/formats.ts";
import { applyCaseMutation, type MutationId } from "./mutations.ts";

export async function runMutations(caseId: string, mutation: MutationId | "all"): Promise<void> {
  const benchmarkCase = await loadBenchmarkCase(caseId);
  const selected =
    mutation === "all"
      ? benchmarkCase.mutations
      : benchmarkCase.mutations.filter((item) => item.id === mutation);
  if (selected.length === 0) {
    throw new Error(`Unknown mutation for ${caseId}: ${mutation}`);
  }

  for (const spec of selected) {
    const mutated = applyCaseMutation(benchmarkCase.canonical, spec);
    const outDir = join(process.cwd(), "results", caseId, "mutations", spec.id);
    await generateArtifacts(mutated, {
      outDir,
      command: `pnpm mutate --case ${caseId} --mutation ${spec.id}`,
    });
    await writeJson(join(outDir, "mutation.manifest.json"), spec);
  }
}
