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
  | "mutation_sensitivity";

export interface EvidenceItem {
  id: string;
  title: string;
  included: boolean;
}

export interface CanonicalCase {
  case_id: string;
  schema_version: string;
  artifact_type: string;
  patient: { age: number; sex: "F" | "M" | "X" };
  status: string;
  summary: string;
  required_documentation_count: number;
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
