---
source_hash: sha256:ff45970e322d04758dbeb131790397f7e3b2de6d948cd9f91412c53a9fa74352
generator: agent-corpus-markdown@0.1.0
schema_version: 0.1.0
case_id: incident-report-001
---

# API Latency Incident Report

API latency incident was caused by an exhausted connection pool after a deploy.

## Key Facts

- Status: resolved
- Required documentation: 4
- Incident status (incident_status): resolved
- Root cause (root_cause): exhausted connection pool
- Start time (start_time): 09:42 UTC
- Next action (next_action): add pool saturation alert

## Evidence

- ev-001: Latency alert fired at 09:42 UTC
- ev-002: Deploy completed at 09:37 UTC
- ev-003: Database pool saturation reached 100 percent

## Diagram

0: deploy -> connection_pool: increases demand
1: connection_pool -> api_latency: saturates
2: api_latency -> alert: triggers

## Actions and Risks

- The incident began at 09:42 UTC.
- The deploy preceded the latency alert.
- The root cause was an exhausted connection pool.
- Pool saturation recurs without alerting (high)
- Deploy rollback playbook remains manual (medium)
