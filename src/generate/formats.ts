import { execFileSync } from "node:child_process";
import { join } from "node:path";

import type { CanonicalCase, StableArtifactMetadata, VolatileArtifactMetadata } from "../types.ts";
import { canonicalHash } from "../core/hash.ts";
import { writeJson, writeText } from "../core/fs.ts";

const CSP = "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; script-src 'self'";

interface GeneratedFile {
  path: string;
  content: string;
}

interface GenerateOptions {
  outDir: string;
  command: string;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function stableMetadata(source: CanonicalCase, generator: string): StableArtifactMetadata {
  return {
    source_hash: canonicalHash(source),
    generator,
    schema_version: source.schema_version,
    case_id: source.case_id,
  };
}

function volatileMetadata(command: string): VolatileArtifactMetadata {
  return {
    generated_at: new Date().toISOString(),
    machine: "[machine]",
    command,
    git_sha: gitSha(),
  };
}

function gitSha(): string | null {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

function metadataScript(metadata: StableArtifactMetadata): string {
  return `<script type="application/json" id="artifact-metadata">${escapeHtml(JSON.stringify(metadata))}</script>`;
}

function caseTable(source: CanonicalCase): string {
  return `<table><tbody>
    <tr><th>Status</th><td>${escapeHtml(source.status)}</td></tr>
    <tr><th>Required documentation</th><td>${source.required_documentation_count}</td></tr>
    <tr><th>Evidence included</th><td>${source.evidence.filter((item) => item.included).length}/${source.evidence.length}</td></tr>
  </tbody></table>`;
}

function htmlShell(title: string, metadata: StableArtifactMetadata, body: string, extraHead = ""): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${CSP}">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 2rem; color: #172026; line-height: 1.5; }
    main { max-width: 960px; margin: 0 auto; }
    h1, h2 { line-height: 1.15; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #d5dde3; padding: 0.55rem; text-align: left; }
    .card { border: 1px solid #d5dde3; border-radius: 6px; padding: 1rem; margin: 0.75rem 0; }
    .risk-high { border-left: 4px solid #b42318; }
    .risk-medium { border-left: 4px solid #b7791f; }
    .toolbar { display: flex; gap: 0.5rem; margin: 1rem 0; }
    button { border: 1px solid #9aa7b2; background: #fff; border-radius: 4px; padding: 0.4rem 0.65rem; }
    svg { max-width: 100%; height: auto; }
  </style>
  ${extraHead}
</head>
<body>
${metadataScript(metadata)}
<main>
${body}
</main>
</body>
</html>
`;
}

function markdown(source: CanonicalCase): GeneratedFile {
  const metadata = stableMetadata(source, "markdown@0.1.0");
  const evidence = source.evidence.map((item) => `| ${item.id} | ${item.title} | ${item.included ? "yes" : "no"} |`).join("\n");
  const sections = source.sections
    .map((section) => `## ${section.title}\n\n${section.claims.map((claim) => `- ${claim.text} (${claim.evidence.join(", ")})`).join("\n")}`)
    .join("\n\n");
  return {
    path: "artifact.md",
    content: `---\nsource_hash: ${metadata.source_hash}\ngenerator: ${metadata.generator}\nschema_version: ${metadata.schema_version}\ncase_id: ${metadata.case_id}\n---\n\n# Prior Authorization Case Summary\n\n${source.summary}\n\n| Field | Value |\n|---|---|\n| Status | ${source.status} |\n| Required documentation | ${source.required_documentation_count} |\n\n${sections}\n\n## Evidence\n\n| ID | Title | Included |\n|---|---|---|\n${evidence}\n\n## Risks\n\n${source.risks.map((risk) => `- ${risk.label} (${risk.severity})`).join("\n")}\n`,
  };
}

function staticHtml(source: CanonicalCase): GeneratedFile {
  const metadata = stableMetadata(source, "html-static@0.1.0");
  const body = `<h1>Prior Authorization Case Summary</h1>
    <p>${escapeHtml(source.summary)}</p>
    ${caseTable(source)}
    ${source.sections.map((section) => `<section class="card"><h2>${escapeHtml(section.title)}</h2><ul>${section.claims.map((claim) => `<li>${escapeHtml(claim.text)}</li>`).join("")}</ul></section>`).join("")}
    <h2>Risks</h2>
    ${source.risks.map((risk) => `<article class="card risk-${risk.severity}">${escapeHtml(risk.label)} (${risk.severity})</article>`).join("")}`;
  return { path: "artifact.html", content: htmlShell("Prior Authorization Case Summary", metadata, body) };
}

function svgHtml(source: CanonicalCase): GeneratedFile {
  const metadata = stableMetadata(source, "html-svg@0.1.0");
  const lines = source.diagram.edges
    .map((edge, index) => {
      const y = 60 + index * 70;
      return `<text x="20" y="${y}">${escapeHtml(edge.from)}</text><line x1="180" y1="${y - 5}" x2="420" y2="${y - 5}" stroke="#3166a6" marker-end="url(#arrow)"/><text x="205" y="${y - 12}">${escapeHtml(edge.label)}</text><text x="450" y="${y}">${escapeHtml(edge.to)}</text>`;
    })
    .join("");
  const alt = source.mutation?.id === "accessibility-error" ? "" : "<title>Prior authorization workflow diagram</title>";
  const body = `<h1>Prior Authorization Workflow</h1>${caseTable(source)}
    <svg role="img" viewBox="0 0 650 280" aria-label="Prior authorization workflow">
      ${alt}
      <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#3166a6"/></marker></defs>
      ${lines}
    </svg>`;
  return { path: "artifact-svg.html", content: htmlShell("Prior Authorization Workflow", metadata, body) };
}

function interactiveHtml(source: CanonicalCase): GeneratedFile[] {
  const metadata = stableMetadata(source, "html-interactive@0.1.0");
  const unsafe = source.mutation?.id === "security-error" ? '<script src="https://example.com/unsafe.js"></script>' : "";
  const body = `<h1>Prior Authorization Interactive Review</h1>
    <div class="toolbar"><button data-filter="all">All</button><button data-filter="included">Included Evidence</button><button data-filter="risk">Risks</button></div>
    <section id="interactive-results" data-sanitizer="DOMPurify">
      ${source.evidence.map((item) => `<article class="card evidence" data-included="${item.included}">${escapeHtml(item.id)}: ${escapeHtml(item.title)}</article>`).join("")}
      ${source.risks.map((risk) => `<article class="card risk">${escapeHtml(risk.label)}</article>`).join("")}
    </section>
    ${unsafe}
    <script src="./artifact-interactive.js"></script>`;
  const script = `const buttons = document.querySelectorAll("button[data-filter]");
const cards = document.querySelectorAll(".card");
for (const button of buttons) {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    for (const card of cards) {
      card.hidden = filter === "included" ? card.dataset.included !== "true" : filter === "risk" ? !card.classList.contains("risk") : false;
    }
  });
}
`;
  return [
    { path: "artifact-interactive.html", content: htmlShell("Interactive Prior Authorization Review", metadata, body) },
    { path: "artifact-interactive.js", content: script },
  ];
}

function jsonRenderer(source: CanonicalCase): GeneratedFile[] {
  const metadata = stableMetadata(source, "json-renderer@0.1.0");
  const payload = { metadata, case: source };
  const body = `<h1>JSON Renderer View</h1><section data-sanitizer="DOMPurify">${caseTable(source)}<pre>${escapeHtml(JSON.stringify(source, null, 2))}</pre></section>`;
  return [
    { path: "artifact.json", content: `${JSON.stringify(payload, null, 2)}\n` },
    { path: "artifact-renderer.html", content: htmlShell("JSON Renderer View", metadata, body) },
  ];
}

function notebook(source: CanonicalCase): GeneratedFile[] {
  const metadata = stableMetadata(source, "notebook@0.1.0");
  const ipynb = {
    cells: [
      { id: "summary", cell_type: "markdown", metadata: {}, source: ["# Prior Authorization Notebook Report\n", source.summary] },
      { id: "case-fields", cell_type: "code", execution_count: null, metadata: {}, outputs: [], source: [`case_status = ${JSON.stringify(source.status)}\nrequired_documentation_count = ${source.required_documentation_count}`] },
      { id: "evidence-count", cell_type: "markdown", metadata: {}, source: [`Evidence items: ${source.evidence.length}`] },
    ],
    metadata: {
      artifact_eval: metadata,
      kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
      language_info: { name: "python", version: "3" },
    },
    nbformat: 4,
    nbformat_minor: 5,
  };
  const html = htmlShell(
    "Notebook Export",
    metadata,
    `<h1>Notebook Export</h1><p>${escapeHtml(source.summary)}</p>${caseTable(source)}<pre>${escapeHtml(JSON.stringify(ipynb.cells, null, 2))}</pre>`,
  );
  return [
    { path: "artifact.ipynb", content: `${JSON.stringify(ipynb, null, 2)}\n` },
    { path: "artifact-notebook.html", content: html },
  ];
}

export async function generateArtifacts(source: CanonicalCase, options: GenerateOptions): Promise<void> {
  const files: GeneratedFile[] = [
    markdown(source),
    staticHtml(source),
    svgHtml(source),
    ...interactiveHtml(source),
    ...jsonRenderer(source),
    ...notebook(source),
  ];

  for (const file of files) {
    await writeText(join(options.outDir, file.path), file.content);
  }

  await writeJson(join(options.outDir, "artifact.meta.json"), volatileMetadata(options.command));
}
