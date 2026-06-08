# Methodology

The benchmark evaluates fitness-for-task, not universal artifact superiority.

## Comparison layers

| Format | Source artifact | Rendered artifact | Main review surface |
|---|---|---|---|
| Markdown | `artifact.md` | Markdown preview HTML | Markdown source + preview |
| Static HTML | `artifact.html` | Browser-rendered HTML | HTML source + rendered page |
| HTML+SVG | `artifact-svg.html` | Browser-rendered HTML + SVG | HTML/SVG source + rendered diagram |
| Interactive HTML | `artifact-interactive.html` | Browser-rendered interactive page | HTML/CSS/JS source + rendered page |
| JSON+renderer | `artifact.json` plus renderer | Renderer-produced HTML | JSON source + rendered page |
| Notebook | `artifact.ipynb` | Executed or exported notebook HTML | Notebook JSON + rendered cells |

## Format fairness rules

1. All formats must be generated from the same canonical JSON.
2. No format may contain extra factual content unavailable to another format.
3. Each format may use native affordances:
   - Markdown may use headings, tables, lists, links, and fenced code.
   - Static HTML may use layout, cards, callouts, tables, anchors, and CSS.
   - HTML+SVG may use diagrams and visual grouping.
   - Interactive HTML may use local filtering, sorting, tabs, and collapsibles.
   - JSON+renderer may expose both raw JSON and rendered view.
   - Notebook may use cells, outputs, and metadata.
4. The benchmark evaluates fitness-for-task, not universal superiority.
5. Stable artifact metadata goes in artifact source: `source_hash`, `generator`, `schema_version`, and `case_id`.
6. Volatile run metadata goes in `artifact.meta.json`: `generated_at`, `machine`, `command`, and `git_sha`.

Volatile metadata is excluded from `diff_noise.normalized` and included in
`reproducibility.traceability`.

## Current claim

This harness generates comparable artifact variants from small controlled fixtures and
automatically measures per-format schema validity, artifact cost, render quality,
accessibility signals, security violations, reviewability, deterministic reader-task coverage,
and observed mutation impact.

Reader-task coverage is local answer-key matching. It is useful for regression testing and
controlled comparison, but it is not a substitute for human studies or live model evaluation.
