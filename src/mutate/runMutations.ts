import { join } from "node:path";

import { loadCanonicalCase } from "../case/loadCase.ts";
import { writeJson } from "../core/fs.ts";
import { generateArtifacts } from "../generate/formats.ts";
import { applyMutation, getMutation, MUTATIONS, type MutationId } from "./mutations.ts";

export async function runMutations(caseId: string, mutation: MutationId | "all"): Promise<void> {
  const source = await loadCanonicalCase(caseId);
  const selected = mutation === "all" ? MUTATIONS.map((item) => item.id) : [mutation];

  for (const id of selected) {
    const mutated = applyMutation(source, id);
    const outDir = join(process.cwd(), "results", caseId, "mutations", id);
    await generateArtifacts(mutated, { outDir, command: `pnpm mutate --case ${caseId} --mutation ${id}` });
    await writeJson(join(outDir, "mutation.manifest.json"), getMutation(id));
  }
}
