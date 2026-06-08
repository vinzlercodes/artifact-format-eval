# ADR 001: Initial Architecture

## Status

Accepted.

## Decision

Use a single modular repository with TypeScript-first orchestration and Python limited to notebook
generation and validation.

## Rationale

The benchmark needs browser, HTML, schema, scoring, and report automation in one reproducible
flow. TypeScript fits that orchestration path. Notebook support is useful but should not become a
second orchestration layer, so Python remains scoped to notebook build and validation commands.
