# Project Map

## Source of truth

```text
schemas/canonical-case.schema.json
cases/<case-id>/canonical.json
cases/<case-id>/questions.json
cases/<case-id>/mutations.json
```

The canonical case is the factual source for generated artifacts. Question manifests define
oracle-backed reader tasks. Mutation manifests define expected degradation channels.

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

## Agent corpus

```text
agent-corpus/<case-id>/codex-rich/
src/corpus/
```

The corpus is a checked-in, API-key-free set of Codex-authored artifacts with provenance
manifests. Benchmark output is copied under:

```text
results/<case-id>/agent-corpus/codex-rich/
```

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
metrics.raw.by-format.json
comprehension.by-format.json
runtime.by-format.json
evidence.by-format.json
scores.by-format.json
scores.raw.json
scores.normalized.json
scores.by-profile.json
```

Reader scoring includes answer accuracy, findability, visual correctness, and interaction success.

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

The generated report is static HTML grouped by benchmark source, with profile winners and
"Where HTML helped" deltas.

## Tests

```text
tests/unit/
tests/fixture/
tests/security/
tests/python/
tests/playwright/
```

`tests/playwright/` is reserved for future browser-binary-backed tests. The current default
test command uses jsdom fallback checks so fresh installs do not need a browser download.
