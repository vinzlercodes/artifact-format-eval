# Command Reference

## Happy path

```bash
pnpm doctor
pnpm benchmark
```

`pnpm benchmark` runs both benchmark sources: deterministic templates and the checked-in
agent corpus. Open `site-dist/index.html` after it completes.

## Full verification

```bash
pnpm verify
```

Runs:

```text
pnpm validate
pnpm typecheck
pnpm test
uv run pytest
pnpm benchmark
uv run python -m artifact_eval_notebook validate results/prior-auth/baseline/artifact.ipynb
pnpm doctor --ci
pnpm test:playwright
```

Install Chromium before running the Playwright gate locally:

```bash
pnpm exec playwright install chromium
```

## Project checks

```bash
pnpm validate
```

Validates all coverage fixture canonical cases and metric registry schemas.

```bash
pnpm typecheck
```

Runs TypeScript typechecking.

```bash
pnpm test
```

Runs TypeScript unit, fixture, and security tests.

```bash
pnpm test:playwright
```

Runs the narrow browser-backed runtime gate for the prior-auth fixture.

```bash
uv run pytest
```

Runs Python notebook tests.

## Benchmark commands

```bash
pnpm generate --case prior-auth
```

Generates baseline artifacts.

```bash
pnpm mutate --case prior-auth --mutation all
```

Generates all mutation variants.

```bash
pnpm mutate --case prior-auth --mutation factual-status-error
```

Generates one mutation variant.

```bash
pnpm evaluate --case prior-auth
```

Writes raw metrics, compact per-format scores, reader-task results, runtime checks, evidence,
legacy compatibility score summaries, and mutation impact files when evaluating mutation runs.

```bash
pnpm evaluate:reader --case prior-auth
```

Runs deterministic local reader-task scoring. This is answer-key coverage, not a human study
and not a live LLM call.

```bash
pnpm evaluate:agent --case prior-auth
```

Compatibility alias for `evaluate:reader`; it does not call an API.

```bash
pnpm report
```

Builds `site-dist/index.html`.

```bash
pnpm benchmark
```

Runs the full local benchmark pipeline for all cases and both sources.

```bash
pnpm benchmark --source templates
pnpm benchmark --source agent-corpus
pnpm benchmark:templates
pnpm benchmark:agent
```

Runs only deterministic templates or only the checked-in agent corpus. The default benchmark
runs both sources and groups them in `site-dist/index.html`.

Template output:

```text
results/<case-id>/baseline/
results/<case-id>/mutations/
```

Agent-corpus output:

```text
results/<case-id>/agent-corpus/codex-rich/
```

## Notebook commands

```bash
uv run python -m artifact_eval_notebook build --case prior-auth
uv run python -m artifact_eval_notebook validate results/prior-auth/baseline/artifact.ipynb
```

## Cleanup

```bash
pnpm clean
```

Removes:

```text
results/
site-dist/
.playwright-artifacts/
coverage/
```

It does not remove dependencies or source files.

## Optional agent evaluation

Live provider-backed agent evaluation is not implemented. Normal verification is API-key-free.
