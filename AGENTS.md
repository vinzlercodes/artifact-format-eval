# Repository Guidelines

## Project Structure & Module Organization

This repository contains an artifact format evaluation harness inspired by Simon Willison's [Using Claude Code: The Unreasonable Effectiveness of HTML](https://simonwillison.net/2026/May/8/unreasonable-effectiveness-of-html/) and the HTML-versus-Markdown agent-output debate. TypeScript source lives in `src/`: `case/` loads fixtures, `generate/` creates template artifacts, `corpus/` loads checked-in agent-corpus artifacts, `mutate/` applies variants, `evaluate/` scores outputs, and `security/` validates HTML handling. Python notebook helpers live in `py_src/artifact_eval_notebook/`. Cases are under `cases/<case-id>/`; rich corpus fixtures are under `agent-corpus/<case-id>/codex-rich/`. Generated outputs go to `results/` and `site-dist/`.

## Build, Test, and Development Commands

- `pnpm install` and `uv sync`: install dependencies.
- `pnpm doctor`: check setup and generated output health.
- `pnpm validate`: validate cases and metric registry schemas.
- `pnpm typecheck`: run TypeScript checking with `tsc --noEmit`.
- `pnpm test`: run TypeScript unit, fixture, and security tests.
- `uv run pytest`: run Python notebook tests.
- `pnpm benchmark`: run generate, mutate, evaluate, and report.
- `pnpm benchmark --source templates`: run deterministic templates only.
- `pnpm benchmark --source agent-corpus`: run checked-in corpus only.
- `pnpm verify`: run the full pre-share verification sequence.
- `pnpm clean`: remove generated `results/`, `site-dist/`, `.playwright-artifacts/`, and `coverage/`.

## Coding Style & Naming Conventions

Use TypeScript ES modules with explicit `.ts` relative imports, as in `import { runBenchmark } from "./benchmark.ts"`. Keep functions small and domain-named. Use `camelCase` for variables/functions, `PascalCase` for types, and descriptive IDs such as `prior-auth` or `factual-status-error`. Match the existing two-space indentation in TypeScript and four-space indentation in Python. No formatter is configured; rely on `pnpm typecheck`, tests, and local consistency.

## Testing Guidelines

TypeScript tests use Node's built-in `node:test` plus `node:assert/strict`; name files `*.test.ts` under the relevant `tests/` subdirectory. Python tests use `pytest` and should be placed in `tests/python/` with names like `test_notebook.py`. Add focused coverage when changing metrics, mutations, generators, case loading, security behavior, or notebook output. Run the narrow command while editing, then `pnpm verify` before sharing broad changes.

## Commit & Pull Request Guidelines

Git history uses Conventional Commit-style subjects, for example `feat: initial artifact format evaluation harness` and `ci: enable node 24 for pages actions`. Keep commits concise and scoped. Pull requests should describe the behavior change, list verification commands run, link issues when available, and include screenshots or report notes when `site-dist/` changes.

## Security & Configuration Tips

Normal verification is API-key-free. Copy `.env.example` only when adding optional local configuration, and do not commit secrets. Treat HTML artifacts and sanitizer changes as security-sensitive; update `tests/security/` and `docs/security-model.md` when behavior changes.

## Workflow Orchestration

### Plan Mode Default

- Enter plan mode for any non-trivial task, defined as 3+ steps, architectural decisions, or meaningful uncertainty.
- Write detailed specs upfront to reduce ambiguity.
- Use plan mode for verification steps, not just implementation.
- If something goes sideways, stop and re-plan immediately.

### Subagent Strategy

- Use subagents liberally to keep the main context window clean.
- Offload research, exploration, and parallel analysis to focused subagents.
- Use one task per subagent.
- For complex problems, use additional subagents rather than overloading one thread.

### Self-Improvement Loop

- After any correction from the user, update `tasks/lessons.md` with the pattern.
- Write rules that prevent the same mistake from recurring.
- Review relevant lessons at session start.
- Ruthlessly iterate on these lessons until the mistake rate drops.

### Verification Before Done

- Never mark a task complete without proving it works.
- Run tests, check logs, and demonstrate correctness where applicable.
- Diff behavior between main and the current changes when relevant.
- Ask: “Would a staff engineer approve this?”

### Demand Elegance, Balanced

- For non-trivial changes, pause and ask whether there is a more elegant approach.
- If a fix feels hacky, rework it into the simplest elegant solution.
- Skip this for simple, obvious fixes; do not over-engineer.
- Challenge the work before presenting it.

### Autonomous Bug Fixing

- When given a bug report, investigate and fix it without asking for unnecessary hand-holding.
- Use logs, errors, failing tests, and reproduction steps to identify the root cause.
- Fix failing CI tests without waiting for step-by-step instructions.
- Minimize context switching for the user.

## Task Management

- Plan first: write the plan to `tasks/todo.md` with checkable items.
- Verify the plan: check in before starting implementation when the task is substantial or ambiguous.
- Track progress: mark items complete as work proceeds.
- Explain changes: provide high-level summaries at meaningful milestones.
- Document results: add a review section to `tasks/todo.md`.
- Capture lessons: update `tasks/lessons.md` after user corrections.
- Demo artifacts: for meaningful changes, create or update a `demo/` folder containing clear reproduction steps, test instructions, expected outputs, screenshots or sample data when useful, and any commands needed to verify the project behavior.

## Core Principles

- Simplicity first: make every change as simple as possible.
- Minimal impact: touch only what is necessary.
- No laziness: find root causes, avoid temporary fixes, and hold senior developer standards.
- No side effects: avoid unrelated changes that introduce new bugs.

## Security & Configuration Tips

Do not commit secrets, patient data, or environment-specific credentials. Keep the local virtual environment disposable, and do not treat `doctor/` as a source directory.

## Code Search

Use `semble search` to find code by describing what it does or naming a symbol/identifier, instead of grep:

```bash
semble search "authentication flow" ./my-project
semble search "save_pretrained" ./my-project
semble search "save model to disk" ./my-project --top-k 10
```

If you anticipate doing more than one search, use `semble index` to create an index.

```bash
semble index ./my-project -o my_index
```

You can then reuse this index later on:

```bash
semble search "save_pretrained" --index my_index
```

An index is not automatically updated, so if the code changes significantly, reindex. If you notice stale results while resolving searches to files, reindex.

Use `--content docs` to search documentation and prose, `--content config` for config files (yaml, toml, etc.), or `--content all` to search code, docs, and config:

```bash
semble search "deployment guide" ./my-project --content docs
semble search "database host port" ./my-project --content config
semble search "authentication" ./my-project --content all
```

Use `semble find-related` to discover code similar to a known location (pass `file_path` and `line` from a prior search result):

```bash
semble find-related src/auth.py 42 ./my-project
```

Like search, `find-related` also accepts an `--index` argument.

`path` defaults to the current directory when omitted; git URLs are accepted.

If `semble` is not on `$PATH`, use `uvx --from "semble[mcp]" semble` in its place.

### Workflow

1. Index the repo using `semble index -o cached_index`.
2. Start with `semble search` to find relevant chunks. Pass the index to achieve results faster.
3. Use `--content docs` for documentation, `--content config` for config files, or `--content all` for everything.
4. Inspect full files only when the returned chunk does not give enough context.
5. Optionally use `semble find-related` with a promising result's `file_path` and `line` to discover related implementations.
6. Use grep only when you need exhaustive literal matches or quick confirmation of an exact string.

<!-- gitnexus:start -->

# GitNexus — Code Intelligence

This project is indexed by GitNexus as **artifact-format-eval** (484 symbols, 814 relationships, 27 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource                                              | Use for                                  |
| ----------------------------------------------------- | ---------------------------------------- |
| `gitnexus://repo/artifact-format-eval/context`        | Codebase overview, check index freshness |
| `gitnexus://repo/artifact-format-eval/clusters`       | All functional areas                     |
| `gitnexus://repo/artifact-format-eval/processes`      | All execution flows                      |
| `gitnexus://repo/artifact-format-eval/process/{name}` | Step-by-step execution trace             |

## CLI

| Task                                         | Read this skill file                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| Understand architecture / "How does X work?" | `.agents/skills/gitnexus/gitnexus-exploring/SKILL.md`       |
| Blast radius / "What breaks if I change X?"  | `.agents/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?"             | `.agents/skills/gitnexus/gitnexus-debugging/SKILL.md`       |
| Rename / extract / split / refactor          | `.agents/skills/gitnexus/gitnexus-refactoring/SKILL.md`     |
| Tools, resources, schema reference           | `.agents/skills/gitnexus/gitnexus-guide/SKILL.md`           |
| Index, status, clean, wiki CLI commands      | `.agents/skills/gitnexus/gitnexus-cli/SKILL.md`             |

<!-- gitnexus:end -->
