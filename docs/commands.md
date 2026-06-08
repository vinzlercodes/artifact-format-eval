# Command Reference

## Happy path

```bash
pnpm doctor
pnpm benchmark
```

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
```

## Project checks

```bash
pnpm validate
```

Validates the canonical prior-auth case and metric registry schemas.

```bash
pnpm typecheck
```

Runs TypeScript typechecking.

```bash
pnpm test
```

Runs TypeScript unit, fixture, and security tests.

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

Writes raw, normalized, and profile scores.

```bash
pnpm report
```

Builds `site-dist/index.html`.

```bash
pnpm benchmark
```

Runs the full local benchmark pipeline.

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

```bash
pnpm evaluate:agent --case prior-auth
```

This is a placeholder in v0.1. Future versions can wire provider-specific API keys here without
making normal CI depend on live model calls.
