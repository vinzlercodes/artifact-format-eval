import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { writeText } from "./core/fs.ts";

function esc(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export async function buildReport(): Promise<void> {
  const baseline = join(process.cwd(), "results", "prior-auth", "baseline");
  const scoresPath = join(baseline, "scores.by-profile.json");
  const scores = existsSync(scoresPath) ? JSON.parse(readFileSync(scoresPath, "utf8")) as Record<string, number> : {};
  const rows = Object.entries(scores)
    .map(([profile, score]) => `<tr><td>${esc(profile)}</td><td>${score.toFixed(3)}</td></tr>`)
    .join("");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
  <title>Artifact Format Evaluation Harness</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 2rem; color: #172026; line-height: 1.5; }
    main { max-width: 960px; margin: 0 auto; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d5dde3; padding: 0.55rem; text-align: left; }
    a { color: #165a9f; }
  </style>
</head>
<body>
<main>
  <h1>Artifact Format Evaluation Harness</h1>
  <p>This v0.1 report compares six generated artifact formats from one synthetic prior-auth canonical source.</p>
  <h2>Profile Scores</h2>
  <table><thead><tr><th>Profile</th><th>Score</th></tr></thead><tbody>${rows}</tbody></table>
  <h2>Artifacts</h2>
  <ul>
    <li><a href="../results/prior-auth/baseline/artifact.md">Markdown source</a></li>
    <li><a href="../results/prior-auth/baseline/artifact.html">Static HTML</a></li>
    <li><a href="../results/prior-auth/baseline/artifact-svg.html">HTML + SVG</a></li>
    <li><a href="../results/prior-auth/baseline/artifact-interactive.html">Interactive HTML</a></li>
    <li><a href="../results/prior-auth/baseline/artifact-renderer.html">JSON renderer</a></li>
    <li><a href="../results/prior-auth/baseline/artifact-notebook.html">Notebook export</a></li>
  </ul>
</main>
</body>
</html>
`;
  await writeText(join(process.cwd(), "site-dist", "index.html"), html);
}
