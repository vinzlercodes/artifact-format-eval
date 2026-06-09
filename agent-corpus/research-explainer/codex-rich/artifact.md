---
source_hash: sha256:5f8c22d6af9fd7eb629e516a1645c3eb19dcd84307f2ed5411ca4666b92ff41d
generator: agent-corpus-markdown@0.1.0
schema_version: 0.1.0
case_id: research-explainer-001
---

# Retrieval-Augmented Generation Explainer

RAG combines retrieval, grounding, generation, and citation review to reduce unsupported answers.

## Key Facts

- Status: ready_for_review
- Required documentation: 4
- Concept status (concept_status): ready_for_review
- Core concept (core_concept): retrieval-augmented generation
- First step (first_step): retrieve relevant passages
- Next action (next_action): verify citations against retrieved passages

## Evidence

- ev-001: Retriever returns candidate passages
- ev-002: Generator drafts an answer grounded in passages
- ev-003: Reviewer verifies citations

## Diagram

0: query -> retriever: asks
1: retriever -> generator: passes context
2: generator -> citation_review: requires verification

## Actions and Risks

- Retrieval-augmented generation starts by retrieving relevant passages.
- Citation review checks generated claims against retrieved passages.
- Generated answer cites an unsupported passage (high)
- Retriever misses important context (medium)
