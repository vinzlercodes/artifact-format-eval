# Agent Corpus

Checked-in Codex-authored fixtures for API-key-free research runs.

Each run lives at `agent-corpus/<case-id>/codex-rich/` and includes `manifest.json`,
format artifacts, renderer sidecars, and notebook exports. These are static fixtures generated
from canonical cases; they do not represent a live provider call during verification.

The corpus exists because deterministic templates alone cannot address the discussion that inspired
this project: HTML is interesting when agents use it as a richer communication medium, not merely
when a renderer wraps the same facts in tags. These fixtures provide repeatable examples with
navigation, SVG-oriented structure, interaction controls, annotations, and export surfaces.
