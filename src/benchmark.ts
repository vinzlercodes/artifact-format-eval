import { runGenerate } from "./generate/runGenerate.ts";
import { runMutations } from "./mutate/runMutations.ts";
import { evaluateCase } from "./evaluate/evaluate.ts";
import { buildReport } from "./report.ts";
import { validateProject } from "./validate.ts";

export async function runBenchmark(options: { caseId: string }): Promise<void> {
  await validateProject();
  await runGenerate(options.caseId);
  await runMutations(options.caseId, "all");
  await evaluateCase(options.caseId);
  await buildReport();
}
