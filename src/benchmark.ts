import { runGenerate } from "./generate/runGenerate.ts";
import { runMutations } from "./mutate/runMutations.ts";
import { evaluateCase } from "./evaluate/evaluate.ts";
import { evaluateDirectory } from "./evaluate/evaluate.ts";
import { buildReport } from "./report.ts";
import { validateProject } from "./validate.ts";
import { listCaseIds } from "./case/loadCase.ts";
import { copyCorpusRun } from "./corpus/loadCorpus.ts";
import type { BenchmarkSource } from "./types.ts";

export async function runBenchmark(options: { caseId?: string; source?: BenchmarkSource }): Promise<void> {
  await validateProject();
  const source = options.source ?? "all";
  const caseIds = options.caseId ? [options.caseId] : await listCaseIds();
  if (source === "templates" || source === "all") {
    for (const caseId of caseIds) {
      await runGenerate(caseId);
      await runMutations(caseId, "all");
      await evaluateCase(caseId, "templates");
    }
  }
  if (source === "agent-corpus" || source === "all") {
    for (const caseId of caseIds) {
      const outDir = `${process.cwd()}/results/${caseId}/agent-corpus/codex-rich`;
      await copyCorpusRun(caseId, "codex-rich", outDir);
      await evaluateDirectory(outDir, { caseId, source: "agent-corpus", runId: "codex-rich" });
    }
  }
  await buildReport();
}
