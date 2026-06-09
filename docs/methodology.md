# Methodology

The benchmark evaluates fitness-for-task, not universal artifact superiority. It was inspired by
Simon Willison's May 8, 2026 post,
[Using Claude Code: The Unreasonable Effectiveness of HTML](https://simonwillison.net/2026/May/8/unreasonable-effectiveness-of-html/),
and the broader discussion around AI-generated HTML artifacts: HTML can express diagrams,
interactions, navigation, and visual hierarchy, while Markdown remains cheaper, simpler, and easier
to review as source.

## Benchmark sources

| Source         | Purpose                                                                              | Output                                    |
| -------------- | ------------------------------------------------------------------------------------ | ----------------------------------------- |
| `templates`    | Controlled deterministic baseline from canonical JSON.                               | `results/<case>/baseline/`                |
| `agent-corpus` | Checked-in Codex-authored fixtures with richer affordances and provenance manifests. | `results/<case>/agent-corpus/codex-rich/` |

The default `pnpm benchmark` runs both sources. Source-specific runs are available with
`--source templates` and `--source agent-corpus`.

## Comparison layers

| Format           | Source artifact               | Rendered artifact                  | Main review surface                |
| ---------------- | ----------------------------- | ---------------------------------- | ---------------------------------- |
| Markdown         | `artifact.md`                 | Markdown preview HTML              | Markdown source + preview          |
| Static HTML      | `artifact.html`               | Browser-rendered HTML              | HTML source + rendered page        |
| HTML+SVG         | `artifact-svg.html`           | Browser-rendered HTML + SVG        | HTML/SVG source + rendered diagram |
| Interactive HTML | `artifact-interactive.html`   | Browser-rendered interactive page  | HTML/CSS/JS source + rendered page |
| JSON+renderer    | `artifact.json` plus renderer | Renderer-produced HTML             | JSON source + rendered page        |
| Notebook         | `artifact.ipynb`              | Executed or exported notebook HTML | Notebook JSON + rendered cells     |

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

This harness generates comparable template variants, evaluates an offline agent-authored corpus,
and automatically measures per-format schema validity, artifact cost, render quality,
accessibility signals, security violations, reviewability, oracle-backed reader-task coverage,
and observed mutation impact.

Reader-task coverage combines answer accuracy, findability landmarks, visual edge checks, and
interaction smoke tests. It is useful for regression testing and controlled comparison, but it
is not a substitute for human studies or live model evaluation.

The intended interpretation is comparative and conditional:

- HTML affordances are useful when the task needs spatial structure, navigation, annotation, or
  interaction.
- Markdown remains useful when compact source review, ecosystem compatibility, or low token cost is
  the primary requirement.
- Profile scores expose these tradeoffs instead of forcing one universal winner.
