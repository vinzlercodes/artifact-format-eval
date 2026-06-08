import { cleanGenerated } from "./clean.ts";
import { runBenchmark } from "./benchmark.ts";
import { runDoctor, formatDoctor } from "./doctor.ts";
import { evaluateCase } from "./evaluate/evaluate.ts";
import { runGenerate } from "./generate/runGenerate.ts";
import { runMutations } from "./mutate/runMutations.ts";
import type { MutationId } from "./mutate/mutations.ts";
import { buildReport } from "./report.ts";
import { validateProject } from "./validate.ts";

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

async function main(): Promise<void> {
  const command = process.argv[2];
  const caseId = argValue("--case", "prior-auth");

  if (command === "validate") {
    await validateProject();
  } else if (command === "generate") {
    await runGenerate(caseId);
  } else if (command === "mutate") {
    await runMutations(caseId, argValue("--mutation", "all") as MutationId | "all");
  } else if (command === "evaluate") {
    await evaluateCase(caseId);
  } else if (command === "evaluate:agent") {
    console.log("Agent re-read evaluation is optional and API-key gated; no-op in v0.1 scaffold.");
  } else if (command === "report") {
    await buildReport();
  } else if (command === "benchmark") {
    await runBenchmark({ caseId });
  } else if (command === "doctor") {
    console.log(formatDoctor(await runDoctor({ ci: process.argv.includes("--ci") })));
  } else if (command === "clean") {
    await cleanGenerated();
  } else {
    throw new Error(`Unknown command: ${command ?? "(missing)"}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
