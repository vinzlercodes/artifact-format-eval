# Installation Guide

This guide assumes you are starting from a folder on your machine, not from an existing GitHub
repository.

## 1. Install system prerequisites

Install these tools first:

```text
Node.js 22 or newer
pnpm
Python 3.11 or newer
uv
```

The repository includes `.python-version` pinned to Python 3.11 for reproducible uv environments.

Check them:

```bash
node --version
pnpm --version
python3 --version
uv --version
```

Expected behavior:

- `node --version` prints `v22...` or newer.
- `pnpm --version` prints a version number.
- `python3 --version` prints `Python 3.11...` or newer.
- `uv --version` prints a version number.

## 2. Install project dependencies

From the project root:

```bash
pnpm install
uv sync
```

`pnpm install` installs TypeScript, Ajv, DOMPurify, Playwright-related packages, and the test
runner stack.

`uv sync` creates the Python environment used for notebook generation and validation.

## 3. Run the local doctor

```bash
pnpm doctor
```

The doctor checks:

- Node version.
- pnpm version.
- Python version.
- uv availability.
- Synthetic prior-auth case exists.
- Normal benchmark runs do not require API keys.

## 4. Run the benchmark

```bash
pnpm benchmark
```

This runs all cases for both sources:

```text
validate
generate template artifacts
mutate template artifacts
evaluate templates
copy/evaluate agent-corpus artifacts
report
```

Successful output creates:

```text
results/prior-auth/baseline/
results/prior-auth/agent-corpus/codex-rich/
results/prior-auth/mutations/
site-dist/index.html
```

## 5. Verify everything

```bash
pnpm verify
```

This runs schema validation, TypeScript typechecking, TypeScript tests, Python tests, benchmark
generation, notebook validation, and doctor checks.

## 6. Open the report

Open this file in a browser:

```text
site-dist/index.html
```

No dev server is required for the generated report.

## Optional: start local Git

This project does not require GitHub. If you want local version history:

```bash
git init
git add .
git commit -m "feat: initial artifact format evaluation harness"
```

Do not commit generated secrets or `.env` files. The repo includes `.gitignore` rules for common
local outputs.
