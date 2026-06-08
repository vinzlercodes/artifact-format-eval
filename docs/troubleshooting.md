# Troubleshooting

## `pnpm install` cannot reach the registry

Symptom:

```text
ENOTFOUND registry.npmjs.org
```

Cause: network, DNS, proxy, or sandbox restrictions.

Fix:

```bash
pnpm install
```

Run it from a normal terminal with network access. If you are behind a corporate proxy, configure
pnpm/npm proxy settings before retrying.

## pnpm says build scripts were ignored

Symptom:

```text
Ignored build scripts: esbuild
```

Fix:

```bash
pnpm approve-builds esbuild
pnpm install
```

This repository records esbuild as an approved build dependency in `pnpm-workspace.yaml`.

## `uv run pytest` cannot access the uv cache

Symptom:

```text
failed to open file ... .cache/uv ...
```

Cause: the current shell or sandbox cannot read uv's cache.

Fix:

Run from a normal terminal:

```bash
uv sync
uv run pytest
```

## `pnpm doctor` reports a missing tool

Install the missing prerequisite, then rerun:

```bash
pnpm doctor
```

Required tools:

- Node.js 22 or newer.
- pnpm.
- Python 3.11 or newer.
- uv.

## `site-dist/index.html` is missing

Generate the report:

```bash
pnpm benchmark
```

or:

```bash
pnpm report
```

`pnpm report` expects scores to exist. `pnpm benchmark` creates everything from scratch.

## Generated outputs are stale

Clean and rebuild:

```bash
pnpm clean
pnpm benchmark
```

## Notebook validation fails

Rebuild and validate:

```bash
uv run python -m artifact_eval_notebook build --case prior-auth
uv run python -m artifact_eval_notebook validate results/prior-auth/baseline/artifact.ipynb
```

## I do not have GitHub yet

That is fine. Use the local workflow:

```bash
pnpm install
uv sync
pnpm verify
```

GitHub is only needed later if you want hosted CI, Pages publishing, issues, pull requests, or a
public repository.
