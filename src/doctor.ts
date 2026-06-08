import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { join } from "node:path";

const exec = promisify(execFile);

export interface DoctorCheck {
  id: string;
  ok: boolean;
  detail: string;
}

export interface DoctorResult {
  apiKeysRequired: false;
  checks: DoctorCheck[];
}

async function version(id: string, command: string, args: string[]): Promise<DoctorCheck> {
  try {
    const { stdout } = await exec(command, args);
    return { id, ok: true, detail: stdout.trim() };
  } catch (error) {
    return { id, ok: false, detail: error instanceof Error ? error.message : "not found" };
  }
}

export async function runDoctor(_options: { ci?: boolean } = {}): Promise<DoctorResult> {
  const checks: DoctorCheck[] = [
    await version("node", "node", ["--version"]),
    await version("pnpm", "pnpm", ["--version"]),
    await version("python", "python3", ["--version"]),
    await version("uv", "uv", ["--version"]),
    { id: "case-prior-auth", ok: existsSync(join(process.cwd(), "cases", "prior-auth", "canonical.json")), detail: "synthetic prior-auth case" },
    { id: "api-keys", ok: true, detail: "no API keys required for normal benchmark" },
  ];
  return { apiKeysRequired: false, checks };
}

export function formatDoctor(result: DoctorResult): string {
  return result.checks.map((check) => `${check.ok ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`).join("\n");
}
