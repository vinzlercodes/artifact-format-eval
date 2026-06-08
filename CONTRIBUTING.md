# Contributing

## Local setup

```bash
pnpm install
uv sync
pnpm doctor
pnpm verify
```

## Development loop

Use the narrowest command while editing:

```bash
pnpm test
pnpm typecheck
uv run pytest
```

Before sharing changes:

```bash
pnpm verify
```

## Adding a metric

1. Add the metric declaration in `src/evaluate/metrics.ts`.
2. Make sure it validates against `schemas/metric-manifest.schema.json`.
3. Add or update evaluator logic in `src/evaluate/evaluate.ts`.
4. Add tests under `tests/unit/`.
5. Run `pnpm verify`.

## Adding a mutation

1. Add the mutation in `src/mutate/mutations.ts`.
2. Add it to `cases/prior-auth/mutations.json`.
3. Confirm output is written under `results/prior-auth/mutations/<mutation-id>/`.
4. Add tests under `tests/unit/` or `tests/fixture/`.

## Adding a format

1. Add the format generator in `src/generate/formats.ts`.
2. Include stable metadata in the artifact source.
3. Put volatile metadata only in sidecars.
4. Add security and evaluation coverage.
5. Update `docs/methodology.md`.

## Generated files

`results/` and `site-dist/` are generated outputs. They are ignored by default.

To regenerate:

```bash
pnpm clean
pnpm benchmark
```
