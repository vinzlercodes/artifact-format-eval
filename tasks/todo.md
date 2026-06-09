# v0.1.1 Cleanup

## Checklist

- [x] Add `.prettierignore` before formatting.
- [x] Add Prettier dependency, config, and scripts.
- [x] Add narrow Playwright runtime checks.
- [x] Update CI and verification docs.
- [x] Format source files.
- [x] Run local verification.
- [x] Run GitNexus change detection.

## Review

- Added Prettier config/scripts, CI format gate, narrow Playwright runtime tests, schema-debt
  limitation note, and v0.1.1 verification demo notes.
- Passed: `pnpm format:check`, `pnpm validate`, `pnpm typecheck`, `pnpm test`,
  workspace `.venv` Python tests, `pnpm benchmark`, notebook validation, and
  `pnpm doctor --ci`.
- `uv run pytest` was blocked by sandbox access to `~/.cache/uv`; workspace `.venv/bin/pytest`
  passed the same Python test.
- `pnpm exec playwright install chromium` was blocked by sandbox access to
  `~/Library/Caches/ms-playwright`; escalation was unavailable due usage limit.
- `pnpm test:playwright` reached the generated-evidence assertion but browser-backed tests could
  not launch Chromium in this sandbox because macOS Mach port registration was denied.
- GitNexus detect-changes reported critical risk because Prettier touched many indexed symbols and
  execution flows; changes are formatting plus the new runtime test/config/docs gate.
