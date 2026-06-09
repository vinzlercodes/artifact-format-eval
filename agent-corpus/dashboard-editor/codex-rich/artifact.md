---
source_hash: sha256:6d0ce6b82dd703e0f1d63622ccaaec36f2a6d99eee7f41d447a234b5d76cf87b
generator: agent-corpus-markdown@0.1.0
schema_version: 0.1.0
case_id: dashboard-editor-001
---

# Revenue Dashboard Editor State

Revenue dashboard editor has a draft filter change that needs review before publishing.

## Key Facts

- Status: draft_needs_review
- Required documentation: 3
- Editor status (editor_status): draft_needs_review
- Active filter (active_filter): region = West
- Pending change (pending_change): hide churned accounts
- Next action (next_action): review filter impact before publish

## Evidence

- ev-001: Draft filter is region = West
- ev-002: Pending change hides churned accounts
- ev-003: Publish checklist requires filter-impact review

## Diagram

0: filter_panel -> preview_chart: updates
1: preview_chart -> reviewer: shows impact
2: reviewer -> publish: approves

## Actions and Risks

- The active filter is region = West.
- The pending change hides churned accounts.
- Review filter impact before publish.
- Published dashboard hides churned accounts unexpectedly (high)
- Regional filter confuses comparison (medium)
