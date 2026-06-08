import { join } from "node:path";

import type { CanonicalCase } from "../types.ts";
import { readJson } from "../core/fs.ts";

export async function loadCanonicalCase(caseId: string): Promise<CanonicalCase> {
  if (caseId !== "prior-auth") {
    throw new Error(`Unsupported case: ${caseId}`);
  }
  return readJson<CanonicalCase>(join(process.cwd(), "cases", "prior-auth", "canonical.json"));
}
