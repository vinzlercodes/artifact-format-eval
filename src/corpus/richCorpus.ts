import { join } from "node:path";

import type { CanonicalCase, CorpusManifest } from "../types.ts";
import { canonicalHash } from "../core/hash.ts";
import { writeJson, writeText } from "../core/fs.ts";

function esc(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function metadata(source: CanonicalCase, generator: string): string {
  return JSON.stringify({
    source_hash: canonicalHash(source),
    generator,
    schema_version: source.schema_version,
    case_id: source.case_id,
  });
}

function rows(source: CanonicalCase): string {
  return [
    `<tr><th>Status</th><td data-field="status">${esc(source.status)}</td></tr>`,
    `<tr><th>Required documentation</th><td data-field="required_documentation_count">${source.required_documentation_count}</td></tr>`,
    ...Object.entries(source.facts ?? {})
      .filter(([key]) => key !== "accessibility_mutation" && key !== "security_mutation")
      .map(([key, fact]) => `<tr><th>${esc(fact.label)}</th><td data-fact="${esc(key)}">${esc(String(fact.value))}</td></tr>`),
  ].join("");
}

function diagramText(source: CanonicalCase): string {
  return source.diagram.edges.map((edge, index) => `${index}: ${edge.from} -> ${edge.to}: ${edge.label}`).join("\n");
}

function evidenceHtml(source: CanonicalCase): string {
  return source.evidence
    .filter((item) => item.included)
    .map((item) => `<li data-evidence-id="${esc(item.id)}">${esc(item.id)}: ${esc(item.title)}</li>`)
    .join("");
}

function htmlShell(source: CanonicalCase, title: string, generator: string, body: string, script = ""): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'self'">
  <title>${esc(title)}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; color: #172026; line-height: 1.5; }
    main { max-width: 1180px; margin: 0 auto; padding: 1.5rem; }
    nav { position: sticky; top: 0; background: #fff; border-bottom: 1px solid #d5dde3; padding: .75rem 1.5rem; display: flex; gap: .75rem; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #d5dde3; padding: .5rem; text-align: left; }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, .55fr); gap: 1rem; }
    .panel, .annotation { border: 1px solid #d5dde3; border-radius: 6px; padding: 1rem; margin: .75rem 0; }
    .high { border-left: 5px solid #b42318; }
    .medium { border-left: 5px solid #b7791f; }
    .tabs button[aria-selected="true"] { font-weight: 700; border-bottom: 3px solid #165a9f; }
    pre { background: #f6f8fa; padding: .75rem; overflow: auto; }
    svg { width: 100%; height: auto; border: 1px solid #d5dde3; }
  </style>
</head>
<body>
<script type="application/json" id="artifact-metadata">${esc(metadata(source, generator))}</script>
<nav><a href="#summary">Summary</a><a href="#evidence">Evidence</a><a href="#diagram">Flow</a><a href="#actions">Actions</a></nav>
<main>${body}</main>
${script}
</body>
</html>
`;
}

export async function writeRichCorpus(source: CanonicalCase, outDir: string): Promise<CorpusManifest> {
  const caseId = source.case_id.replace(/-001$/, "");
  const runId = "codex-rich";
  const prompt = `Create rich HTML, Markdown, JSON, and notebook artifacts for ${source.title}.`;
  const manifest: CorpusManifest = {
    case_id: caseId,
    run_id: runId,
    source: "agent-authored-corpus",
    prompt,
    authoring_agent: "Codex",
    date_policy: "static fixture generated from canonical case; no live provider call",
    formats: {
      markdown: "artifact.md",
      "html-static": "artifact.html",
      "html-svg": "artifact-svg.html",
      "html-interactive": "artifact-interactive.html",
      "json-renderer": "artifact.json",
      notebook: "artifact.ipynb",
    },
  };

  const evidence = source.evidence.filter((item) => item.included).map((item) => `- ${item.id}: ${item.title}`).join("\n");
  const facts = Object.entries(source.facts ?? {})
    .filter(([key]) => key !== "accessibility_mutation" && key !== "security_mutation")
    .map(([key, fact]) => `- ${fact.label} (${key}): ${fact.value}`)
    .join("\n");
  await writeText(
    join(outDir, "artifact.md"),
    `---\nsource_hash: ${canonicalHash(source)}\ngenerator: agent-corpus-markdown@0.1.0\nschema_version: ${source.schema_version}\ncase_id: ${source.case_id}\n---\n\n# ${source.title}\n\n${source.summary}\n\n## Key Facts\n\n- Status: ${source.status}\n- Required documentation: ${source.required_documentation_count}\n${facts}\n\n## Evidence\n\n${evidence}\n\n## Diagram\n\n${diagramText(source)}\n\n## Actions and Risks\n\n${source.sections.flatMap((section) => section.claims.map((claim) => `- ${claim.text}`)).join("\n")}\n${source.risks.map((risk) => `- ${risk.label} (${risk.severity})`).join("\n")}\n`,
  );

  const common = `<section id="summary" class="panel"><h1>${esc(source.title ?? "Artifact")}</h1><p>${esc(source.summary)}</p><table>${rows(source)}</table></section>
<section id="evidence" class="panel"><h2>Evidence Checklist</h2><ul>${evidenceHtml(source)}</ul></section>
<section id="actions" class="panel"><h2>Annotated Findings</h2>${source.sections.map((section) => `<article class="annotation"><h3>${esc(section.title)}</h3>${section.claims.map((claim) => `<p data-claim-id="${esc(claim.id)}">${esc(claim.text)}</p>`).join("")}</article>`).join("")}</section>
<section class="panel"><h2>Risks</h2>${source.risks.map((risk) => `<article class="${esc(risk.severity)}" data-risk-severity="${esc(risk.severity)}">${esc(risk.label)}</article>`).join("")}</section>`;
  await writeText(join(outDir, "artifact.html"), htmlShell(source, source.title ?? "Artifact", "agent-corpus-html-static@0.1.0", common));

  const svgLines = source.diagram.edges
    .map((edge, index) => {
      const y = 55 + index * 70;
      return `<g data-diagram-edge="${index}"><text x="20" y="${y}">${esc(edge.from)}</text><line x1="170" y1="${y - 5}" x2="410" y2="${y - 5}" stroke="#165a9f" marker-end="url(#arrow)"/><text x="190" y="${y - 15}">${esc(edge.label)}</text><text x="440" y="${y}">${esc(edge.to)}</text></g>`;
    })
    .join("");
  await writeText(
    join(outDir, "artifact-svg.html"),
    htmlShell(
      source,
      `${source.title} Flow`,
      "agent-corpus-html-svg@0.1.0",
      `${common}<section id="diagram" class="panel"><h2>Visual Flow</h2><svg role="img" aria-label="Artifact decision flow" viewBox="0 0 680 280"><title>Artifact decision flow</title><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#165a9f"/></marker></defs>${svgLines}</svg><pre>${esc(diagramText(source))}</pre></section>`,
    ),
  );

  const interactiveScript = `<script src="./artifact-interactive.js"></script>`;
  await writeText(
    join(outDir, "artifact-interactive.html"),
    htmlShell(
      source,
      `${source.title} Interactive`,
      "agent-corpus-html-interactive@0.1.0",
      `<div class="grid" data-sanitizer="DOMPurify"><div>${common}<section id="diagram" class="panel"><h2>Flow Map</h2><pre>${esc(diagramText(source))}</pre></section></div><aside class="panel"><h2>Task Tools</h2><div class="tabs"><button data-tab="all" data-filter="all" aria-selected="true">All</button><button data-tab="evidence" data-filter="included">Evidence</button><button data-tab="risks" data-filter="risk">Risks</button></div><label>Export note<textarea id="export-note">${esc(source.status)} | ${source.required_documentation_count}</textarea></label><button id="copy-export" data-interaction="copy-export">Copy export</button><output id="interaction-result" data-interaction-result="">Ready</output></aside></div>`,
      interactiveScript,
    ),
  );
  await writeText(
    join(outDir, "artifact-interactive.js"),
    `const tabs = document.querySelectorAll("[data-tab]");
const result = document.querySelector("#interaction-result");
for (const tab of tabs) tab.addEventListener("click", () => {
  for (const item of tabs) item.setAttribute("aria-selected", String(item === tab));
  result.textContent = "Focused " + tab.dataset.tab;
  result.dataset.interactionResult = "tab:" + tab.dataset.tab;
});
document.querySelector("#copy-export")?.addEventListener("click", () => {
  result.textContent = document.querySelector("#export-note")?.value ?? "";
  result.dataset.interactionResult = "copied";
});
`,
  );

  const payload = { metadata: JSON.parse(metadata(source, "agent-corpus-json@0.1.0")), case: source, affordances: { diagram: source.diagram.edges, evidence: source.evidence } };
  await writeText(join(outDir, "artifact.json"), `${JSON.stringify(payload, null, 2)}\n`);
  await writeText(join(outDir, "artifact-renderer.html"), htmlShell(source, "JSON Renderer", "agent-corpus-json-renderer@0.1.0", `${common}<pre>${esc(JSON.stringify(payload, null, 2))}</pre>`));

  const notebook = {
    cells: [
      { id: "summary", cell_type: "markdown", metadata: {}, source: [`# ${source.title}\n`, source.summary] },
      { id: "facts", cell_type: "markdown", metadata: {}, source: [`Status: ${source.status}\nRequired documentation: ${source.required_documentation_count}\n${facts}`] },
      { id: "evidence", cell_type: "markdown", metadata: {}, source: [evidence] },
      { id: "diagram", cell_type: "markdown", metadata: {}, source: [diagramText(source)] },
    ],
    metadata: { artifact_eval: JSON.parse(metadata(source, "agent-corpus-notebook@0.1.0")), kernelspec: { display_name: "Python 3", language: "python", name: "python3" }, language_info: { name: "python", version: "3" } },
    nbformat: 4,
    nbformat_minor: 5,
  };
  await writeText(join(outDir, "artifact.ipynb"), `${JSON.stringify(notebook, null, 2)}\n`);
  await writeText(join(outDir, "artifact-notebook.html"), htmlShell(source, "Notebook Export", "agent-corpus-notebook-html@0.1.0", `${common}<pre>${esc(JSON.stringify(notebook.cells, null, 2))}</pre>`));
  await writeJson(join(outDir, "manifest.json"), manifest);
  return manifest;
}
