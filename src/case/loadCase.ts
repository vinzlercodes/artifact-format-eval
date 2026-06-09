import { readdirSync } from "node:fs";
import { join } from "node:path";

import type {
  BenchmarkCase,
  CaseMutationSpec,
  CanonicalCase,
  ComprehensionQuestion,
} from "../types.ts";
import { readJson } from "../core/fs.ts";

const CASES_DIR = "cases";

export async function listCaseIds(): Promise<string[]> {
  return readdirSync(join(process.cwd(), CASES_DIR), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export async function loadBenchmarkCase(caseId: string): Promise<BenchmarkCase> {
  const root = join(process.cwd(), CASES_DIR, caseId);
  const canonical = await readJson<CanonicalCase>(join(root, "canonical.json"));
  const questionsFile = await readJson<{ case_id: string; questions: ComprehensionQuestion[] }>(
    join(root, "questions.json"),
  );
  const mutationsFile = await readJson<{ case_id: string; mutations: CaseMutationSpec[] }>(
    join(root, "mutations.json"),
  );
  return {
    caseId,
    canonical,
    questions: questionsFile.questions,
    mutations: mutationsFile.mutations,
  };
}

export async function loadCanonicalCase(caseId: string): Promise<CanonicalCase> {
  return (await loadBenchmarkCase(caseId)).canonical;
}
