export type FormatId =
  | "markdown"
  | "html-static"
  | "html-svg"
  | "html-interactive"
  | "json-renderer"
  | "notebook";

export type MetricCategory =
  | "validity"
  | "cost"
  | "render"
  | "accessibility"
  | "security"
  | "reviewability"
  | "mutation_sensitivity"
  | "comprehension";

export type ProfileId =
  | "human_reviewer"
  | "agent_reader"
  | "security_sensitive"
  | "accessibility_first"
  | "cost_sensitive";

export interface EvidenceItem {
  id: string;
  title: string;
  included: boolean;
}

export interface BenchmarkFact {
  label: string;
  value: string | number | boolean;
}

export interface CanonicalCase {
  case_id: string;
  schema_version: string;
  artifact_type: string;
  domain?: string;
  title?: string;
  patient: { age: number; sex: "F" | "M" | "X" };
  status: string;
  summary: string;
  required_documentation_count: number;
  facts?: Record<string, BenchmarkFact>;
  evidence: EvidenceItem[];
  sections: Array<{
    id: string;
    title: string;
    claims: Array<{ id: string; text: string; evidence: string[] }>;
  }>;
  diagram: { edges: Array<{ from: string; to: string; label: string }> };
  risks: Array<{ id: string; label: string; severity: "low" | "medium" | "high" }>;
  questions: string[];
  mutation?: {
    id: string;
    description: string;
  };
}

export interface ComprehensionQuestion {
  id: string;
  prompt: string;
  expected: string;
  aliases?: string[];
}

export interface JsonPatchOperation {
  op: "replace";
  path: string;
  value: unknown;
}

export interface CaseMutationSpec {
  id: string;
  description: string;
  patch: JsonPatchOperation[];
  affected_questions: string[];
  expected_degradation: Array<"comprehension" | "accessibility" | "security" | "render" | "reviewability">;
}

export interface BenchmarkCase {
  caseId: string;
  canonical: CanonicalCase;
  questions: ComprehensionQuestion[];
  mutations: CaseMutationSpec[];
}

export type MetricScores = Record<MetricCategory, number>;

export type ProfileScores = Record<ProfileId, number>;

export interface StableArtifactMetadata {
  source_hash: string;
  generator: string;
  schema_version: string;
  case_id: string;
}

export interface VolatileArtifactMetadata {
  generated_at: string;
  machine: string;
  command: string;
  git_sha: string | null;
}
