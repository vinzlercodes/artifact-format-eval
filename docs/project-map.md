# Project Map

## Source of truth

```text
schemas/canonical-case.schema.json
cases/prior-auth/canonical.json
```

The canonical case is the only factual source for generated artifacts.

## Format generation

```text
src/generate/formats.ts
src/generate/runGenerate.ts
```

Generates:

- Markdown.
- Static HTML.
- HTML+SVG.
- Interactive HTML.
- JSON+renderer.
- Notebook.

Stable metadata lives inside artifact source:

```json
{
  "source_hash": "sha256:...",
  "generator": "html-static@0.1.0",
  "schema_version": "0.1.0",
  "case_id": "prior-auth-001"
}
```

Volatile metadata lives in `artifact.meta.json`.

## Mutations

```text
src/mutate/mutations.ts
src/mutate/runMutations.ts
cases/prior-auth/mutations.json
```

The six v0.1 mutations are:

- `factual-status-error`
- `omitted-evidence`
- `visual-diagram-error`
- `table-value-error`
- `accessibility-error`
- `security-error`

## Evaluation

```text
schemas/metric-manifest.schema.json
src/evaluate/metrics.ts
src/evaluate/evaluate.ts
```

Scores are written to:

```text
scores.raw.json
scores.normalized.json
scores.by-profile.json
```

## Security checks

```text
src/security/htmlSecurity.ts
tests/security/security.test.ts
docs/security-model.md
```

v0.1 security means artifact sandbox hygiene: CSP, no remote scripts, no inline event handlers,
sanitizer markers where needed, and expected security-mutation score drops.

## Notebook helper

```text
py_src/artifact_eval_notebook/
tests/python/test_notebook.py
```

Python is intentionally limited to notebook build and validation.

## Report

```text
src/report.ts
site-dist/index.html
```

The generated report is static HTML.

## Tests

```text
tests/unit/
tests/fixture/
tests/security/
tests/python/
tests/playwright/
```

`tests/playwright/` is reserved for future browser-binary-backed tests. The current default
benchmark uses static render/security checks so fresh installs do not need a browser download.
