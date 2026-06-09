# ADR 001: Initial Architecture

## Status

Accepted.

## Decision

Use a single modular repository with TypeScript-first orchestration and Python limited to notebook
generation and validation.

Use two benchmark sources:

- Deterministic templates generated from canonical JSON.
- Checked-in agent-corpus artifacts for repeatable rich-HTML comparison.

## Rationale

The benchmark needs browser, HTML, schema, scoring, and report automation in one reproducible
flow. TypeScript fits that orchestration path. Notebook support is useful but should not become a
second orchestration layer, so Python remains scoped to notebook build and validation commands.

The HTML-versus-Markdown question needs both controlled fixture generation and richer artifact
examples. Keeping both sources local and API-key-free makes normal CI deterministic while still
allowing the report to analyze HTML affordances.
