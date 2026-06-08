# Artifact Format Evaluation Harness

Benchmark harness for comparing agent artifact formats from small controlled coverage fixtures.

The benchmark compares Markdown, static HTML, HTML+SVG, interactive HTML, JSON+renderer,
and notebook-style output across five fixture domains: prior authorization, code review,
incident reports, research explainers, and dashboard-editor state. It measures per-format
validity, artifact cost, render hygiene, accessibility signals, sandbox security,
reviewability, deterministic reader-task coverage, and observed mutation impact.

## Start here

You do not need a GitHub repo to use this project. Everything runs locally.

Required tools:

- Node.js 22 or newer
- pnpm
- Python 3.11 or newer
- uv

Fresh install:

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

Full verification:

```bash
pnpm verify
```

Python notebook helpers:

```bash
uv run python -m artifact_eval_notebook build --case prior-auth
uv run python -m artifact_eval_notebook validate results/prior-auth/baseline/artifact.ipynb
```

## Detailed setup

- [Installation guide](docs/installation.md)
- [Project map](docs/project-map.md)
- [Command reference](docs/commands.md)
- [Troubleshooting](docs/troubleshooting.md)
- [GitHub optional setup](docs/github-optional.md)
- [Contributing](CONTRIBUTING.md)

## CLI

```bash
pnpm validate
pnpm generate --case prior-auth
pnpm evaluate:reader --case prior-auth
pnpm mutate --case prior-auth --mutation all
pnpm evaluate --case prior-auth
pnpm report
pnpm benchmark
pnpm doctor --ci
pnpm clean
pnpm verify
```

`pnpm evaluate:reader --case prior-auth` performs deterministic local reader-task scoring.
`pnpm evaluate:agent --case prior-auth` is retained as a compatibility alias for
`evaluate:reader`; it does not call an API.

## Output

```text
results/prior-auth/baseline/
results/prior-auth/mutations/
results/code-review/
results/incident-report/
results/research-explainer/
results/dashboard-editor/
site-dist/
```

The benchmark report is generated at `site-dist/index.html`.

## What gets generated

Baseline:

```text
results/prior-auth/baseline/artifact.md
results/prior-auth/baseline/artifact.html
results/prior-auth/baseline/artifact-svg.html
results/prior-auth/baseline/artifact-interactive.html
results/prior-auth/baseline/artifact.json
results/prior-auth/baseline/artifact.ipynb
results/prior-auth/baseline/metrics.raw.by-format.json
results/prior-auth/baseline/scores.by-format.json
results/prior-auth/baseline/comprehension.by-format.json
results/prior-auth/baseline/runtime.by-format.json
results/prior-auth/baseline/evidence.by-format.json
results/prior-auth/baseline/scores.raw.json
results/prior-auth/baseline/scores.normalized.json
results/prior-auth/baseline/scores.by-profile.json
```

Mutations:

```text
results/prior-auth/mutations/factual-status-error/
results/prior-auth/mutations/omitted-evidence/
results/prior-auth/mutations/visual-diagram-error/
results/prior-auth/mutations/table-value-error/
results/prior-auth/mutations/accessibility-error/
results/prior-auth/mutations/security-error/
```

## Current scope

This is a local deterministic benchmark. The five cases are intentionally small coverage
fixtures, not five full research studies. Human studies and live LLM re-read evaluation are
intentionally out of scope for normal setup.
