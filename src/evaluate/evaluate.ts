import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import type { FormatId, MetricCategory } from "../types.ts";
import { writeJson } from "../core/fs.ts";
import { scanHtmlSecurity } from "../security/htmlSecurity.ts";
import { scoreProfiles } from "./metrics.ts";

const FORMAT_FILES: Record<FormatId, string> = {
  markdown: "artifact.md",
  "html-static": "artifact.html",
  "html-svg": "artifact-svg.html",
  "html-interactive": "artifact-interactive.html",
  "json-renderer": "artifact.json",
  notebook: "artifact.ipynb",
};

const HTML_FILES = ["artifact.html", "artifact-svg.html", "artifact-interactive.html", "artifact-renderer.html", "artifact-notebook.html"];

export interface EvaluationResult {
  raw: Record<string, unknown>;
  normalized: Record<MetricCategory, number>;
  byProfile: Record<string, number>;
}

function lineCount(value: string): number {
  return value.length === 0 ? 0 : value.split(/\r?\n/).length;
}

function tokenEstimate(value: string): number {
  return Math.ceil(value.length / 4);
}

function metadataPresent(value: string): boolean {
  return /source_hash|source_hash:/.test(value) && /generator|generator:/.test(value) && /schema_version|schema_version:/.test(value);
}

function notebookValid(path: string): boolean {
  if (!existsSync(path)) return false;
  const notebook = JSON.parse(readFileSync(path, "utf8")) as { nbformat?: number; cells?: unknown[]; metadata?: Record<string, unknown> };
  return notebook.nbformat === 4 && Array.isArray(notebook.cells) && Boolean(notebook.metadata?.artifact_eval);
}

function diffProxy(dir: string): number {
  const manifest = join(dir, "mutation.manifest.json");
  if (!existsSync(manifest)) return 0;
  const mutation = JSON.parse(readFileSync(manifest, "utf8")) as { id: string };
  return mutation.id === "security-error" ? 18 : mutation.id === "accessibility-error" ? 10 : 6;
}

export async function evaluateDirectory(dir: string): Promise<EvaluationResult> {
  const raw: Record<string, unknown> = {};
  const formatScores: number[] = [];

  for (const [format, file] of Object.entries(FORMAT_FILES) as Array<[FormatId, string]>) {
    const path = join(dir, file);
    const content = existsSync(path) ? readFileSync(path, "utf8") : "";
    raw[`${format}.bytes`] = existsSync(path) ? statSync(path).size : 0;
    raw[`${format}.loc`] = lineCount(content);
    raw[`${format}.estimated_tokens`] = tokenEstimate(content);
    raw[`${format}.metadata_present`] = metadataPresent(content);
    formatScores.push(metadataPresent(content) ? 1 : 0);
  }

  raw["notebook.nbformat_valid"] = notebookValid(join(dir, "artifact.ipynb"));
  const securityResults = HTML_FILES.filter((file) => existsSync(join(dir, file))).map((file) => {
    const html = readFileSync(join(dir, file), "utf8");
    return scanHtmlSecurity(html, { requiresSanitizer: file === "artifact-interactive.html" || file === "artifact-renderer.html" });
  });
  raw["security.violations"] = securityResults.flatMap((result) => result.violations);
  raw["security.pass_count"] = securityResults.filter((result) => result.passed).length;
  raw["render.pages_checked"] = securityResults.length;
  raw["accessibility.serious_or_critical"] = readFileSync(join(dir, "artifact-svg.html"), "utf8").includes("<title>") ? 0 : 1;
  raw["review.diff_noise.normalized"] = diffProxy(dir);
  raw["mutation.expected_impact_observed"] = existsSync(join(dir, "mutation.manifest.json")) ? 1 : 0;

  const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
  const normalized: Record<MetricCategory, number> = {
    validity: avg([...formatScores, raw["notebook.nbformat_valid"] ? 1 : 0]),
    cost: Math.max(0, 1 - avg(Object.entries(raw).filter(([key]) => key.endsWith(".estimated_tokens")).map(([, value]) => Number(value))) / 1200),
    render: Number(raw["render.pages_checked"]) >= 5 ? 1 : 0,
    accessibility: Number(raw["accessibility.serious_or_critical"]) === 0 ? 1 : 0.5,
    security: securityResults.length === 0 ? 0 : securityResults.filter((result) => result.passed).length / securityResults.length,
    reviewability: Math.max(0, 1 - Number(raw["review.diff_noise.normalized"]) / 30),
    mutation_sensitivity: existsSync(join(dir, "mutation.manifest.json")) ? 1 : 0.75,
  };
  const byProfile = scoreProfiles(normalized);

  await writeJson(join(dir, "scores.raw.json"), raw);
  await writeJson(join(dir, "scores.normalized.json"), normalized);
  await writeJson(join(dir, "scores.by-profile.json"), byProfile);

  return { raw, normalized, byProfile };
}

export async function evaluateCase(caseId: string): Promise<void> {
  const root = join(process.cwd(), "results", caseId);
  await evaluateDirectory(join(root, "baseline"));
  for (const mutation of [
    "factual-status-error",
    "omitted-evidence",
    "visual-diagram-error",
    "table-value-error",
    "accessibility-error",
    "security-error",
  ]) {
    const dir = join(root, "mutations", mutation);
    if (existsSync(dir)) {
      await evaluateDirectory(dir);
    }
  }
}
