import { join } from "node:path";

import { loadCanonicalCase } from "../case/loadCase.ts";
import { generateArtifacts } from "./formats.ts";

export async function runGenerate(caseId: string): Promise<void> {
  const source = await loadCanonicalCase(caseId);
  await generateArtifacts(source, {
    outDir: join(process.cwd(), "results", caseId, "baseline"),
    command: `pnpm generate --case ${caseId}`,
  });
}
