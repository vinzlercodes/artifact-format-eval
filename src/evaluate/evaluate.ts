import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

import { loadBenchmarkCase } from "../case/loadCase.ts";
import { writeJson } from "../core/fs.ts";
import { scanHtmlSecurity } from "../security/htmlSecurity.ts";
import type { CaseMutationSpec, ComprehensionQuestion, FormatId, MetricCategory, MetricScores } from "../types.ts";
import { scoreProfiles } from "./metrics.ts";

const FORMAT_FILES: Record<FormatId, string> = {
  markdown: "artifact.md",
  "html-static": "artifact.html",
  "html-svg": "artifact-svg.html",
  "html-interactive": "artifact-interactive.html",
  "json-renderer": "artifact.json",
  notebook: "artifact.ipynb",
};

const RENDER_FILES: Partial<Record<FormatId, string>> = {
  "html-static": "artifact.html",
  "html-svg": "artifact-svg.html",
  "html-interactive": "artifact-interactive.html",
  "json-renderer": "artifact-renderer.html",
  notebook: "artifact-notebook.html",
};

export interface EvaluationResult {
  raw: Record<FormatId, Record<string, unknown>>;
  normalized: Record<FormatId, MetricScores>;
  byProfile: Record<FormatId, ReturnType<typeof scoreProfiles>>;
}

interface ReaderResult {
  case_id: string;
  run_id: string;
  method: "deterministic-local-reader";
  formats: Record<FormatId, {
    accuracy: number;
    questions: Array<ComprehensionQuestion & { matched: boolean; matched_value: string | null }>;
  }>;
}

interface RuntimeResult {
  case_id: string;
  run_id: string;
  formats: Record<FormatId, {
    page_loads: boolean;
    key_sections_visible: boolean;
    console_errors: string[];
    external_requests: string[];
    axe_serious_or_critical: number;
    svg_has_accessible_name: boolean | null;
    interaction_smoke_passed: boolean | null;
    security_violations: string[];
    engine: "playwright" | "jsdom-fallback";
  }>;
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

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsAnswer(text: string, question: ComprehensionQuestion): { matched: boolean; matched_value: string | null } {
  const haystack = normalize(text);
  for (const candidate of [question.expected, ...(question.aliases ?? [])]) {
    if (haystack.includes(normalize(candidate))) {
      return { matched: true, matched_value: candidate };
    }
  }
  return { matched: false, matched_value: null };
}

function htmlText(path: string): string {
  if (!existsSync(path)) return "";
  const dom = new JSDOM(readFileSync(path, "utf8"));
  return dom.window.document.body.textContent ?? "";
}

function readableText(dir: string, format: FormatId): string {
  const primary = join(dir, FORMAT_FILES[format]);
  if (!existsSync(primary)) return "";
  if (format === "markdown") return readFileSync(primary, "utf8");
  if (format === "json-renderer") {
    return `${readFileSync(primary, "utf8")}\n${htmlText(join(dir, "artifact-renderer.html"))}`;
  }
  if (format === "notebook") {
    const notebook = JSON.parse(readFileSync(primary, "utf8")) as { cells?: Array<{ source?: string | string[] }> };
    return [
      ...(notebook.cells ?? []).flatMap((cell) => Array.isArray(cell.source) ? cell.source : [cell.source ?? ""]),
      htmlText(join(dir, "artifact-notebook.html")),
    ].join("\n");
  }
  return htmlText(primary);
}

function evaluateReader(dir: string, caseId: string, runId: string, questions: ComprehensionQuestion[]): ReaderResult {
  const formats = {} as ReaderResult["formats"];
  for (const format of Object.keys(FORMAT_FILES) as FormatId[]) {
    const text = readableText(dir, format);
    const answers = questions.map((question) => ({ ...question, ...containsAnswer(text, question) }));
    formats[format] = {
      accuracy: answers.filter((answer) => answer.matched).length / Math.max(answers.length, 1),
      questions: answers,
    };
  }
  return { case_id: caseId, run_id: runId, method: "deterministic-local-reader", formats };
}

function fallbackRuntime(dir: string, caseId: string, runId: string): RuntimeResult {
  const formats = {} as RuntimeResult["formats"];
  for (const format of Object.keys(FORMAT_FILES) as FormatId[]) {
    const renderFile = RENDER_FILES[format];
    if (!renderFile) {
      formats[format] = {
        page_loads: true,
        key_sections_visible: true,
        console_errors: [],
        external_requests: [],
        axe_serious_or_critical: 0,
        svg_has_accessible_name: null,
        interaction_smoke_passed: null,
        security_violations: [],
        engine: "jsdom-fallback",
      };
      continue;
    }

    const path = join(dir, renderFile);
    const html = existsSync(path) ? readFileSync(path, "utf8") : "";
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const security = scanHtmlSecurity(html, { requiresSanitizer: format === "html-interactive" || format === "json-renderer" });
    const svg = document.querySelector("svg");
    const svgHasName = svg ? Boolean(svg.querySelector("title")?.textContent?.trim() || svg.getAttribute("aria-label")?.trim()) : null;
    formats[format] = {
      page_loads: Boolean(document.querySelector("main") || document.body),
      key_sections_visible: Boolean(document.querySelector("h1")),
      console_errors: [],
      external_requests: security.violations.includes("external_network_reference") || security.violations.includes("remote_script") ? ["external reference detected"] : [],
      axe_serious_or_critical: svgHasName === false ? 1 : 0,
      svg_has_accessible_name: svgHasName,
      interaction_smoke_passed: format === "html-interactive" ? document.querySelectorAll("button[data-filter]").length >= 3 : null,
      security_violations: security.violations,
      engine: "jsdom-fallback",
    };
  }
  return { case_id: caseId, run_id: runId, formats };
}

async function evaluateRuntime(dir: string, caseId: string, runId: string): Promise<RuntimeResult> {
  if (process.env.ARTIFACT_EVAL_RUNTIME === "jsdom") {
    return fallbackRuntime(dir, caseId, runId);
  }
  let browser:
    | {
        newPage(): Promise<{
          on(event: "console", handler: (message: { type(): string; text(): string }) => void): void;
          on(event: "request", handler: (request: { url(): string }) => void): void;
          goto(url: string, options?: { waitUntil?: "domcontentloaded"; timeout?: number }): Promise<void>;
          locator(selector: string): { count(): Promise<number>; click(): Promise<void> };
          evaluate<T>(fn: () => T): Promise<T>;
          close(): Promise<void>;
        }>;
        newContext(): Promise<{
          newPage(): Promise<{
            on(event: "console", handler: (message: { type(): string; text(): string }) => void): void;
            on(event: "request", handler: (request: { url(): string }) => void): void;
            goto(url: string, options?: { waitUntil?: "domcontentloaded"; timeout?: number }): Promise<void>;
            locator(selector: string): { count(): Promise<number>; click(): Promise<void> };
            evaluate<T>(fn: () => T): Promise<T>;
            close(): Promise<void>;
          }>;
          close(): Promise<void>;
        }>;
        close(): Promise<void>;
      }
    | undefined;
  try {
    const playwright = await import("@playwright/test") as unknown as { chromium: { launch(options: { headless: boolean }): Promise<unknown> } };
    const axeModule = await import("@axe-core/playwright") as unknown as { default: new (options: { page: unknown }) => { analyze(): Promise<{ violations: Array<{ impact?: string }> }> } };
    browser = await playwright.chromium.launch({ headless: true }) as NonNullable<typeof browser>;
    const context = await browser.newContext();
    const formats = {} as RuntimeResult["formats"];
    try {
      for (const format of Object.keys(FORMAT_FILES) as FormatId[]) {
        const renderFile = RENDER_FILES[format];
        if (!renderFile) {
          formats[format] = {
            page_loads: true,
            key_sections_visible: true,
            console_errors: [],
            external_requests: [],
            axe_serious_or_critical: 0,
            svg_has_accessible_name: null,
            interaction_smoke_passed: null,
            security_violations: [],
            engine: "playwright",
          };
          continue;
        }
        const htmlPath = join(dir, renderFile);
        const html = existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "";
        const security = scanHtmlSecurity(html, { requiresSanitizer: format === "html-interactive" || format === "json-renderer" });
        const page = await context.newPage();
        const consoleErrors: string[] = [];
        const externalRequests: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") consoleErrors.push(message.text());
        });
        page.on("request", (request) => {
          if (/^https?:\/\//i.test(request.url())) externalRequests.push(request.url());
        });
        try {
          await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "domcontentloaded", timeout: 2000 });
          const keySectionsVisible = (await page.locator("h1").count()) > 0;
          const interaction = format === "html-interactive" ? (await page.locator("button[data-filter]").count()) >= 3 : null;
          if (format === "html-interactive" && interaction) {
            await page.locator('button[data-filter="included"]').click();
          }
          const svgHasName = await page.evaluate(() => {
            const svg = document.querySelector("svg");
            if (!svg) return null;
            return Boolean(svg.querySelector("title")?.textContent?.trim() || svg.getAttribute("aria-label")?.trim());
          });
          const axe = await new axeModule.default({ page }).analyze();
          formats[format] = {
            page_loads: true,
            key_sections_visible: keySectionsVisible,
            console_errors: consoleErrors,
            external_requests: [...new Set([...externalRequests, ...(security.violations.includes("remote_script") ? ["remote script"] : [])])],
            axe_serious_or_critical: axe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical").length + (svgHasName === false ? 1 : 0),
            svg_has_accessible_name: svgHasName,
            interaction_smoke_passed: interaction,
            security_violations: security.violations,
            engine: "playwright",
          };
        } finally {
          await page.close();
        }
      }
    } finally {
      await context.close();
    }
    return { case_id: caseId, run_id: runId, formats };
  } catch {
    return fallbackRuntime(dir, caseId, runId);
  } finally {
    await browser?.close().catch(() => undefined);
  }
}

function rawMetrics(dir: string): Record<FormatId, Record<string, unknown>> {
  const raw = {} as Record<FormatId, Record<string, unknown>>;
  for (const [format, file] of Object.entries(FORMAT_FILES) as Array<[FormatId, string]>) {
    const path = join(dir, file);
    const content = existsSync(path) ? readFileSync(path, "utf8") : "";
    raw[format] = {
      bytes: existsSync(path) ? statSync(path).size : 0,
      loc: lineCount(content),
      estimated_tokens: tokenEstimate(content),
      metadata_present: metadataPresent(content),
      notebook_valid: format === "notebook" ? notebookValid(path) : null,
    };
  }
  return raw;
}

function normalizeScores(
  raw: Record<FormatId, Record<string, unknown>>,
  reader: ReaderResult,
  runtime: RuntimeResult,
  mutationImpact?: MutationImpact,
): Record<FormatId, MetricScores> {
  const result = {} as Record<FormatId, MetricScores>;
  const maxTokens = Math.max(...Object.values(raw).map((item) => Number(item.estimated_tokens)), 1);
  for (const format of Object.keys(FORMAT_FILES) as FormatId[]) {
    const runtimeFormat = runtime.formats[format];
    const securityPass = runtimeFormat.security_violations.length === 0;
    const accessibility = runtimeFormat.svg_has_accessible_name === false ? 0.25 : runtimeFormat.axe_serious_or_critical > 0 ? 0.5 : 1;
    const mutationSensitivity = mutationImpact ? (mutationImpact.by_format[format]?.observed ? 1 : 0) : 0.75;
    result[format] = {
      validity: raw[format].metadata_present && (format !== "notebook" || raw[format].notebook_valid) ? 1 : 0,
      cost: Math.max(0, 1 - Number(raw[format].estimated_tokens) / (maxTokens * 1.25)),
      render: runtimeFormat.page_loads && runtimeFormat.key_sections_visible && runtimeFormat.interaction_smoke_passed !== false ? 1 : 0,
      accessibility,
      security: securityPass ? 1 : 0,
      reviewability: Math.max(0, 1 - Number(raw[format].loc) / 180),
      mutation_sensitivity: mutationSensitivity,
      comprehension: reader.formats[format].accuracy,
    };
  }
  return result;
}

function runIdForDir(dir: string): string {
  const parts = dir.split(/[/\\]/);
  const mutationIndex = parts.lastIndexOf("mutations");
  return mutationIndex >= 0 ? parts[mutationIndex + 1] ?? "mutation" : "baseline";
}

interface MutationImpact {
  mutation_id: string;
  affected_questions: string[];
  observed: boolean;
  observed_channels: string[];
  by_format: Record<FormatId, {
    baseline_accuracy: number;
    mutated_accuracy: number;
    affected_accuracy_delta: number;
    observed: boolean;
  }>;
}

function affectedAccuracy(reader: ReaderResult, format: FormatId, affected: string[]): number {
  if (affected.length === 0) return reader.formats[format].accuracy;
  const questions = reader.formats[format].questions.filter((question) => affected.includes(question.id));
  return questions.filter((question) => question.matched).length / Math.max(questions.length, 1);
}

function buildMutationImpact(
  mutation: CaseMutationSpec,
  baselineReader: ReaderResult,
  mutatedReader: ReaderResult,
  baselineRuntime: RuntimeResult,
  mutatedRuntime: RuntimeResult,
): MutationImpact {
  const byFormat = {} as MutationImpact["by_format"];
  const channels = new Set<string>();
  for (const format of Object.keys(FORMAT_FILES) as FormatId[]) {
    const baselineAccuracy = affectedAccuracy(baselineReader, format, mutation.affected_questions);
    const mutatedAccuracy = affectedAccuracy(mutatedReader, format, mutation.affected_questions);
    const comprehensionDrop = mutation.affected_questions.length > 0 && mutatedAccuracy < baselineAccuracy;
    const accessibilityDrop =
      mutation.expected_degradation.includes("accessibility") &&
      mutatedRuntime.formats[format].axe_serious_or_critical > baselineRuntime.formats[format].axe_serious_or_critical;
    const securityDrop =
      mutation.expected_degradation.includes("security") &&
      mutatedRuntime.formats[format].security_violations.length > baselineRuntime.formats[format].security_violations.length;
    if (comprehensionDrop) channels.add("comprehension");
    if (accessibilityDrop) channels.add("accessibility");
    if (securityDrop) channels.add("security");
    byFormat[format] = {
      baseline_accuracy: baselineAccuracy,
      mutated_accuracy: mutatedAccuracy,
      affected_accuracy_delta: mutatedAccuracy - baselineAccuracy,
      observed: comprehensionDrop || accessibilityDrop || securityDrop,
    };
  }
  return {
    mutation_id: mutation.id,
    affected_questions: mutation.affected_questions,
    observed: Object.values(byFormat).some((item) => item.observed),
    observed_channels: [...channels].sort(),
    by_format: byFormat,
  };
}

export async function evaluateDirectory(
  dir: string,
  options?: {
    caseId?: string;
    questions?: ComprehensionQuestion[];
    baselineDir?: string;
    mutation?: CaseMutationSpec;
  },
): Promise<EvaluationResult> {
  const caseId = options?.caseId ?? "prior-auth";
  const runId = runIdForDir(dir);
  const questions = options?.questions ?? (await loadBenchmarkCase(caseId)).questions;
  const raw = rawMetrics(dir);
  const reader = evaluateReader(dir, caseId, runId, questions);
  const runtime = await evaluateRuntime(dir, caseId, runId);

  let mutationImpact: MutationImpact | undefined;
  if (options?.baselineDir && options.mutation) {
    const baselineReader = evaluateReader(options.baselineDir, caseId, "baseline", questions);
    const baselineRuntime = await evaluateRuntime(options.baselineDir, caseId, "baseline");
    mutationImpact = buildMutationImpact(options.mutation, baselineReader, reader, baselineRuntime, runtime);
    await writeJson(join(dir, "mutation-impact.json"), mutationImpact);
  }

  const normalized = normalizeScores(raw, reader, runtime, mutationImpact);
  const byProfile = Object.fromEntries(
    (Object.keys(FORMAT_FILES) as FormatId[]).map((format) => [format, scoreProfiles(normalized[format])]),
  ) as EvaluationResult["byProfile"];
  const scores = {
    case_id: caseId,
    run_id: runId,
    formats: Object.fromEntries(
      (Object.keys(FORMAT_FILES) as FormatId[]).map((format) => [
        format,
        {
          metrics: normalized[format],
          profiles: byProfile[format],
        },
      ]),
    ),
  };
  const evidence = {
    case_id: caseId,
    run_id: runId,
    formats: Object.fromEntries(
      (Object.keys(FORMAT_FILES) as FormatId[]).map((format) => [
        format,
        {
          raw: raw[format],
          reader_accuracy: reader.formats[format].accuracy,
          runtime: runtime.formats[format],
        },
      ]),
    ),
  };

  await writeJson(join(dir, "metrics.raw.by-format.json"), { case_id: caseId, run_id: runId, formats: raw });
  await writeJson(join(dir, "comprehension.by-format.json"), reader);
  await writeJson(join(dir, "runtime.by-format.json"), runtime);
  await writeJson(join(dir, "scores.by-format.json"), scores);
  await writeJson(join(dir, "evidence.by-format.json"), evidence);

  await writeJson(join(dir, "scores.raw.json"), raw);
  await writeJson(join(dir, "scores.normalized.json"), normalized);
  await writeJson(join(dir, "scores.by-profile.json"), byProfile);

  return { raw, normalized, byProfile };
}

export async function runReaderEvaluation(caseId: string): Promise<void> {
  const benchmarkCase = await loadBenchmarkCase(caseId);
  const baseline = join(process.cwd(), "results", caseId, "baseline");
  if (!existsSync(baseline)) {
    throw new Error(`Missing generated baseline artifacts for ${caseId}`);
  }
  await evaluateDirectory(baseline, { caseId, questions: benchmarkCase.questions });
}

export async function evaluateCase(caseId: string): Promise<void> {
  const benchmarkCase = await loadBenchmarkCase(caseId);
  const root = join(process.cwd(), "results", caseId);
  const baselineDir = join(root, "baseline");
  await evaluateDirectory(baselineDir, { caseId, questions: benchmarkCase.questions });
  for (const mutation of benchmarkCase.mutations) {
    const dir = join(root, "mutations", mutation.id);
    if (existsSync(dir)) {
      await evaluateDirectory(dir, {
        caseId,
        questions: benchmarkCase.questions,
        baselineDir,
        mutation,
      });
    }
  }
}
