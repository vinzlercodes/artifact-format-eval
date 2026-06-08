import type { CanonicalCase } from "../types.ts";

export interface MutationDefinition {
  id:
    | "factual-status-error"
    | "omitted-evidence"
    | "visual-diagram-error"
    | "table-value-error"
    | "accessibility-error"
    | "security-error";
  description: string;
  expected_metric_impacts: string[];
  expected_profiles_affected: string[];
}

export const MUTATIONS: MutationDefinition[] = [
  {
    id: "factual-status-error",
    description: "Changes case status to an incorrect approved state.",
    expected_metric_impacts: ["mutation.factual_status_detected", "regulated_evidence.score"],
    expected_profiles_affected: ["agent_handoff", "regulated_evidence"],
  },
  {
    id: "omitted-evidence",
    description: "Marks one required evidence item as omitted.",
    expected_metric_impacts: ["mutation.omitted_evidence_detected", "regulated_evidence.score"],
    expected_profiles_affected: ["regulated_evidence"],
  },
  {
    id: "visual-diagram-error",
    description: "Reverses one diagram edge to create an incorrect workflow.",
    expected_metric_impacts: ["mutation.visual_diagram_detected", "dashboard.score"],
    expected_profiles_affected: ["executive_comprehension", "dashboard"],
  },
  {
    id: "table-value-error",
    description: "Changes one required documentation count in the artifact representation.",
    expected_metric_impacts: ["mutation.table_value_detected", "review.diff_noise", "regulated_evidence.score"],
    expected_profiles_affected: ["human_review", "agent_handoff", "regulated_evidence"],
  },
  {
    id: "accessibility-error",
    description: "Adds an accessibility defect marker to rendered formats.",
    expected_metric_impacts: ["accessibility.axe_violations", "mutation.accessibility_detected"],
    expected_profiles_affected: ["executive_comprehension", "dashboard"],
  },
  {
    id: "security-error",
    description: "Adds an unsafe script marker that security scans must catch.",
    expected_metric_impacts: ["security.no_external_scripts", "security.score"],
    expected_profiles_affected: ["dashboard", "regulated_evidence"],
  },
];

export type MutationId = MutationDefinition["id"];

export function getMutation(id: MutationId): MutationDefinition {
  const mutation = MUTATIONS.find((item) => item.id === id);
  if (!mutation) {
    throw new Error(`Unknown mutation: ${id}`);
  }
  return mutation;
}

export function applyMutation(source: CanonicalCase, id: MutationId): CanonicalCase {
  const mutation = getMutation(id);
  const next = structuredClone(source) as CanonicalCase;
  next.mutation = { id, description: mutation.description };

  if (id === "factual-status-error") {
    next.status = "approved";
  } else if (id === "omitted-evidence") {
    next.evidence[1] = { ...next.evidence[1], included: false };
  } else if (id === "visual-diagram-error") {
    next.diagram.edges[0] = { from: next.diagram.edges[0].to, to: next.diagram.edges[0].from, label: "incorrect reverse flow" };
  } else if (id === "table-value-error") {
    next.required_documentation_count = Math.max(0, next.required_documentation_count - 1);
  } else if (id === "accessibility-error") {
    next.summary = `${next.summary} Accessibility mutation: image alternative text intentionally omitted.`;
  } else if (id === "security-error") {
    next.summary = `${next.summary} Security mutation: unsafe remote script intentionally injected.`;
  }

  return next;
}
