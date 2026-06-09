import type { CaseMutationSpec, CanonicalCase, JsonPatchOperation } from "../types.ts";

export type MutationDefinition = CaseMutationSpec;

export const MUTATIONS: CaseMutationSpec[] = [
  {
    id: "factual-status-error",
    description: "Changes case status to an incorrect approved state.",
    patch: [{ op: "replace", path: "/status", value: "approved" }],
    affected_questions: ["q1"],
    expected_degradation: ["comprehension"],
  },
  {
    id: "omitted-evidence",
    description: "Marks one required evidence item as omitted.",
    patch: [{ op: "replace", path: "/evidence/0/included", value: false }],
    affected_questions: ["q2"],
    expected_degradation: ["comprehension"],
  },
  {
    id: "visual-diagram-error",
    description: "Reverses one diagram edge to create an incorrect workflow.",
    patch: [
      { op: "replace", path: "/diagram/edges/0/from", value: "payer" },
      { op: "replace", path: "/diagram/edges/0/to", value: "clinician" },
    ],
    affected_questions: ["q4"],
    expected_degradation: ["comprehension"],
  },
  {
    id: "table-value-error",
    description: "Changes one required documentation count in the artifact representation.",
    patch: [{ op: "replace", path: "/required_documentation_count", value: 2 }],
    affected_questions: ["q3"],
    expected_degradation: ["comprehension"],
  },
  {
    id: "accessibility-error",
    description: "Adds an accessibility defect marker to rendered formats.",
    patch: [{ op: "replace", path: "/facts/accessibility_mutation/value", value: true }],
    affected_questions: [],
    expected_degradation: ["accessibility"],
  },
  {
    id: "security-error",
    description: "Adds an unsafe script marker that security scans must catch.",
    patch: [{ op: "replace", path: "/facts/security_mutation/value", value: true }],
    affected_questions: [],
    expected_degradation: ["security"],
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
  const next = applyJsonPatch(source, mutation.patch);
  next.mutation = { id, description: mutation.description };
  return next;
}

export function applyCaseMutation(
  source: CanonicalCase,
  mutation: CaseMutationSpec,
): CanonicalCase {
  const next = applyJsonPatch(source, mutation.patch);
  next.mutation = { id: mutation.id, description: mutation.description };
  return next;
}

export function applyJsonPatch(source: CanonicalCase, patch: JsonPatchOperation[]): CanonicalCase {
  const next = structuredClone(source) as unknown as Record<string, unknown>;
  for (const operation of patch) {
    if (operation.op !== "replace") {
      throw new Error(`Unsupported patch operation: ${operation.op}`);
    }
    replaceAtPointer(next, operation.path, operation.value);
  }
  return next as unknown as CanonicalCase;
}

function replaceAtPointer(target: Record<string, unknown>, pointer: string, value: unknown): void {
  if (!pointer.startsWith("/")) {
    throw new Error(`Invalid JSON pointer: ${pointer}`);
  }
  const parts = pointer
    .slice(1)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));
  let current: unknown = target;
  for (const part of parts.slice(0, -1)) {
    if (Array.isArray(current)) {
      current = current[Number(part)];
    } else if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      throw new Error(`Cannot resolve JSON pointer: ${pointer}`);
    }
  }
  const last = parts.at(-1);
  if (last === undefined) {
    throw new Error(`Invalid JSON pointer: ${pointer}`);
  }
  if (Array.isArray(current)) {
    current[Number(last)] = value;
  } else if (current && typeof current === "object" && last in current) {
    (current as Record<string, unknown>)[last] = value;
  } else {
    throw new Error(`Cannot replace missing JSON pointer: ${pointer}`);
  }
}
