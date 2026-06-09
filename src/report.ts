import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { listCaseIds } from "./case/loadCase.ts";
import { writeText } from "./core/fs.ts";

function esc(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function formatScore(value: unknown): string {
  return typeof value === "number" ? value.toFixed(3) : "";
}

function scoreSection(caseId: string, label: string, dir: string): string | null {
  const scoresPath = join(dir, "scores.by-format.json");
  if (!existsSync(scoresPath)) return null;
  const scores = JSON.parse(readFileSync(scoresPath, "utf8")) as {
    source?: string;
    formats: Record<string, { metrics: Record<string, number>; profiles: Record<string, number> }>;
  };
  const rows = Object.entries(scores.formats)
    .map(([format, result]) => {
      const bestProfile = Object.entries(result.profiles).sort((a, b) => b[1] - a[1])[0];
      return `<tr>
        <td>${esc(format)}</td>
        <td>${formatScore(result.metrics.comprehension)}</td>
        <td>${formatScore(result.metrics.reviewability)}</td>
        <td>${formatScore(result.metrics.accessibility)}</td>
        <td>${formatScore(result.metrics.security)}</td>
        <td>${formatScore(result.metrics.cost)}</td>
        <td>${esc(bestProfile?.[0] ?? "")}: ${formatScore(bestProfile?.[1])}</td>
      </tr>`;
    })
    .join("");
  const profileWinners = ["human_reviewer", "agent_reader", "security_sensitive", "accessibility_first", "cost_sensitive"]
    .map((profile) => {
      const winner = Object.entries(scores.formats).sort((a, b) => (b[1].profiles[profile] ?? 0) - (a[1].profiles[profile] ?? 0))[0];
      return `<li>${esc(profile)}: ${esc(winner?.[0] ?? "n/a")} (${formatScore(winner?.[1].profiles[profile])})</li>`;
    })
    .join("");
  const markdown = scores.formats.markdown;
  const helped = ["html-static", "html-svg", "html-interactive"]
    .filter((format) => scores.formats[format])
    .map((format) => {
      const result = scores.formats[format];
      const comprehensionDelta = (result.metrics.comprehension ?? 0) - (markdown?.metrics.comprehension ?? 0);
      const reviewDelta = (result.metrics.reviewability ?? 0) - (markdown?.metrics.reviewability ?? 0);
      return `<li>${esc(format)}: comprehension ${formatScore(comprehensionDelta)}, reviewability ${formatScore(reviewDelta)}</li>`;
    })
    .join("");
  return `<section>
    <h2>${esc(caseId)} · ${esc(label)}</h2>
    <h3>Profile Winners</h3>
    <ul>${profileWinners}</ul>
    <h3>Where HTML helped</h3>
    <ul>${helped}</ul>
    <h3>Format Scores</h3>
    <table>
      <thead><tr><th>Format</th><th>Reader</th><th>Review</th><th>A11y</th><th>Security</th><th>Cost</th><th>Best profile</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p><a href="../${esc(dir)}/scores.by-format.json">scores.by-format.json</a> · <a href="../${esc(dir)}/evidence.by-format.json">evidence.by-format.json</a></p>
  </section>`;
}

export async function buildReport(): Promise<void> {
  const caseIds = await listCaseIds();
  const sections: string[] = [];

  for (const caseId of caseIds) {
    const baseline = join(process.cwd(), "results", caseId, "baseline");
    const templateSection = scoreSection(caseId, "templates", baseline);
    if (templateSection) sections.push(templateSection);
    const corpus = join(process.cwd(), "results", caseId, "agent-corpus", "codex-rich");
    const corpusSection = scoreSection(caseId, "agent-corpus", corpus);
    if (corpusSection) sections.push(corpusSection);
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
  <title>Artifact Format Evaluation Harness</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 2rem; color: #172026; line-height: 1.5; }
    main { max-width: 1120px; margin: 0 auto; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0 2rem; }
    th, td { border: 1px solid #d5dde3; padding: 0.55rem; text-align: left; }
    th { background: #f5f7f9; }
    section { border-top: 1px solid #d5dde3; padding-top: 1rem; margin-top: 1.5rem; }
    a { color: #165a9f; }
  </style>
</head>
<body>
<main>
  <h1>Artifact Format Evaluation Harness</h1>
  <p>This report compares template artifacts and API-key-free agent-corpus artifacts. Reader scores combine answer accuracy, findability, visual checks, and interaction smoke tests; this is still not a human-study result.</p>
  ${sections.join("\n")}
</main>
</body>
</html>
`;
  await writeText(join(process.cwd(), "site-dist", "index.html"), html);
}
