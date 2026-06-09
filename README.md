# Artifact Format Evaluation Harness

## Inspiration

This project is a practical benchmark for the HTML-versus-Markdown discussion in agent output.
It was inspired by Simon Willison's link post,
[Using Claude Code: The Unreasonable Effectiveness of HTML](https://simonwillison.net/2026/May/8/unreasonable-effectiveness-of-html/),
and Thariq Shihipar's companion gallery of agent-produced HTML artifacts,
[The unreasonable effectiveness of HTML](https://thariqs.github.io/html-effectiveness/).

The motivating claim is simple: when an AI generates the artifact, Markdown's strengths
(easy to type, easy to hand-edit, token efficient) matter less than they did for humans writing
documents manually. HTML can add SVG diagrams, interactive widgets, navigation, custom editors,
timelines, annotated diffs, and richer visual hierarchy. The counterargument is also fair:
Markdown is cheaper, easier to diff, easier to review in source form, and supported almost
everywhere. This harness exists to evaluate that tradeoff instead of arguing from examples alone.

## What This Measures

The benchmark compares six artifact formats:

- Markdown.
- Static HTML.
- HTML+SVG.
- Interactive HTML.
- JSON plus renderer.
- Notebook-style output.

It runs across five small coverage domains:

- Prior authorization.
- Code review.
- Incident report.
- Research explainer.
- Dashboard editor state.

It evaluates two API-key-free sources:

- `templates`: deterministic renderers generated from canonical JSON.
- `agent-corpus`: checked-in Codex-authored fixtures with richer HTML affordances and provenance manifests.

The score model measures validity, artifact cost, render hygiene, accessibility signals, sandbox
security, reviewability, oracle-backed reader-task coverage, and observed mutation impact. Reader
coverage combines answer accuracy, findability landmarks, visual edge checks, and interaction smoke
tests. It is not a human study and it is not a live LLM evaluation.

## Current Interpretation

The project does not claim that HTML universally beats Markdown. Current results are more useful
than that:

- HTML tends to win on affordance-specific measures such as reviewability, diagrams, navigation,
  and interaction.
- Markdown tends to win on compactness and source-review simplicity.
- Security-sensitive and cost-sensitive profiles can still favor Markdown or non-interactive formats.

This is the intended analytical framing: HTML is worth asking for when the task benefits from
spatial layout, interaction, visual hierarchy, or task-specific controls. Markdown is still a strong
default for lightweight, diff-friendly source artifacts.

## Requirements

- Node.js 22 or newer.
- pnpm.
- Python 3.11 or newer.
- uv.

The repository pins local Python with `.python-version` and normal verification requires no API keys.

## Quick Start

```bash
pnpm install
uv sync
pnpm doctor
pnpm benchmark
```

Open the generated report:

```text
site-dist/index.html
```

Run full verification:

```bash
pnpm verify
```

## Common Commands

```bash
pnpm validate
pnpm typecheck
pnpm test
uv run pytest
pnpm benchmark
pnpm verify
```

Benchmark sources:

```bash
pnpm benchmark --source templates
pnpm benchmark --source agent-corpus
pnpm benchmark:templates
pnpm benchmark:agent
```

Case-specific generation:

```bash
pnpm generate --case prior-auth
pnpm mutate --case prior-auth --mutation all
pnpm evaluate --case prior-auth
pnpm report
```

Notebook helper:

```bash
uv run python -m artifact_eval_notebook build --case prior-auth
uv run python -m artifact_eval_notebook validate results/prior-auth/baseline/artifact.ipynb
```

Clean generated outputs:

```bash
pnpm clean
```

## Output Layout

```text
results/<case-id>/baseline/
results/<case-id>/mutations/
results/<case-id>/agent-corpus/codex-rich/
site-dist/index.html
```

Each evaluated run writes:

```text
metrics.raw.by-format.json
comprehension.by-format.json
runtime.by-format.json
scores.by-format.json
evidence.by-format.json
scores.raw.json
scores.normalized.json
scores.by-profile.json
```

Mutation runs also write:

```text
mutation-impact.json
```

## Repository Map

```text
src/                     TypeScript benchmark orchestration, generation, evaluation, reports
src/corpus/              Agent-corpus loading and rich fixture writer
py_src/                  Python notebook build/validation helper
cases/                   Canonical benchmark cases, reader questions, mutation manifests
agent-corpus/            Checked-in Codex-authored artifact corpus
schemas/                 JSON schemas for canonical cases and metrics
tests/                   Unit, fixture, security, and Python tests
docs/                    Methodology, commands, troubleshooting, rubrics
```

Generated outputs live in `results/` and `site-dist/`; do not edit them by hand.

## Documentation

- [Installation guide](docs/installation.md)
- [Project map](docs/project-map.md)
- [Methodology](docs/methodology.md)
- [Command reference](docs/commands.md)
- [Scoring rubric](docs/scoring-rubric.md)
- [Accessibility rubric](docs/accessibility-rubric.md)
- [Security model](docs/security-model.md)
- [Known limitations](docs/known-limitations.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Contributing](CONTRIBUTING.md)

## Scope

This is a local deterministic research harness, not a publish-grade study. The five cases are small
coverage fixtures, the agent corpus is checked in for repeatability, and live provider-backed
generation is intentionally outside normal setup. The goal is to make the HTML-versus-Markdown
tradeoff measurable enough to guide agent-output decisions.
