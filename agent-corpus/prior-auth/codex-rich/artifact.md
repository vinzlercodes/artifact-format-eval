---
source_hash: sha256:fe6450cfa258903457888a53d9d82ed74785daccdc894af182cf3c9f897ce787
generator: agent-corpus-markdown@0.1.0
schema_version: 0.1.0
case_id: prior-auth-001
---

# Prior Authorization Case Summary

MRI lumbar spine requires prior authorization before scheduling.

## Key Facts

- Status: additional_info_requested
- Required documentation: 3
- Authorization status (authorization_status): additional_info_requested
- Next action (next_action): Submit the clinical note and therapy history
- High risk (high_risk): Documentation mismatch between policy and clinical note

## Evidence

- ev-001: Payer policy requires conservative therapy documentation
- ev-002: Clinical note documents six weeks of physical therapy
- ev-003: Imaging request includes neurologic deficit rationale

## Diagram

0: clinician -> payer: submits request
1: payer -> clinic_ops: requests documentation
2: clinic_ops -> payer: returns evidence packet

## Actions and Risks

- The request is for a lumbar spine MRI.
- The case is waiting on payer-requested supporting documentation.
- Submit the clinical note and therapy history before the payer deadline.
- Deadline missed before evidence packet is returned (medium)
- Documentation mismatch between policy and clinical note (high)
