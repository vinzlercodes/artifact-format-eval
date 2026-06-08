import { join } from "node:path";

import { removeIfExists } from "./core/fs.ts";

export async function cleanGenerated(): Promise<void> {
  for (const path of ["results", "site-dist", ".playwright-artifacts", "coverage"]) {
    await removeIfExists(join(process.cwd(), path));
  }
}
