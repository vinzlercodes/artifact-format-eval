import { runGenerate } from "./generate/runGenerate.ts";
import { runMutations } from "./mutate/runMutations.ts";
import { evaluateCase } from "./evaluate/evaluate.ts";
import { buildReport } from "./report.ts";
import { validateProject } from "./validate.ts";
import { listCaseIds } from "./case/loadCase.ts";

export async function runBenchmark(options: { caseId?: string }): Promise<void> {
  await validateProject();
  const caseIds = options.caseId ? [options.caseId] : await listCaseIds();
  for (const caseId of caseIds) {
    await runGenerate(caseId);
    await runMutations(caseId, "all");
    await evaluateCase(caseId);
  }
  await buildReport();
}
