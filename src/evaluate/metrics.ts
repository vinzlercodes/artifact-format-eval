import type { FormatId, MetricCategory } from "../types.ts";

export interface MetricManifest {
  id: string;
  label: string;
  category: MetricCategory;
  direction: "lower_is_better" | "higher_is_better" | "boolean";
  unit: string;
  applies_to: FormatId[];
  source: string;
}

const ALL_FORMATS: FormatId[] = [
  "markdown",
  "html-static",
  "html-svg",
  "html-interactive",
  "json-renderer",
  "notebook",
];

export const METRIC_REGISTRY: MetricManifest[] = [
  {
    id: "validity.schema",
    label: "Canonical JSON Schema validity",
    category: "validity",
    direction: "boolean",
    unit: "pass",
    applies_to: ALL_FORMATS,
    source: "ajv",
  },
  {
    id: "validity.generator_metadata",
    label: "Stable generator metadata present",
    category: "validity",
    direction: "boolean",
    unit: "pass",
    applies_to: ALL_FORMATS,
    source: "artifact-source",
  },
  {
    id: "validity.nbformat",
    label: "Notebook format validity",
    category: "validity",
    direction: "boolean",
    unit: "pass",
    applies_to: ["notebook"],
    source: "nbformat",
  },
  {
    id: "artifact.bytes",
    label: "Artifact file size",
    category: "cost",
    direction: "lower_is_better",
    unit: "bytes",
    applies_to: ALL_FORMATS,
    source: "filesystem",
  },
  {
    id: "artifact.loc",
    label: "Artifact line count",
    category: "cost",
    direction: "lower_is_better",
    unit: "lines",
    applies_to: ALL_FORMATS,
    source: "filesystem",
  },
  {
    id: "artifact.estimated_tokens",
    label: "Estimated token count",
    category: "cost",
    direction: "lower_is_better",
    unit: "tokens",
    applies_to: ALL_FORMATS,
    source: "heuristic",
  },
  {
    id: "render.page_loads",
    label: "Rendered page loads",
    category: "render",
    direction: "boolean",
    unit: "pass",
    applies_to: ["html-static", "html-svg", "html-interactive", "json-renderer", "notebook"],
    source: "playwright",
  },
  {
    id: "render.key_sections_visible",
    label: "Key sections visible",
    category: "render",
    direction: "boolean",
    unit: "pass",
    applies_to: ALL_FORMATS,
    source: "content-scan",
  },
  {
    id: "accessibility.axe_violations",
    label: "axe violation count",
    category: "accessibility",
    direction: "lower_is_better",
    unit: "violations",
    applies_to: ["html-static", "html-svg", "html-interactive", "json-renderer", "notebook"],
    source: "axe-core",
  },
  {
    id: "security.csp_present",
    label: "Strict CSP present",
    category: "security",
    direction: "boolean",
    unit: "pass",
    applies_to: ["html-static", "html-svg", "html-interactive", "json-renderer", "notebook"],
    source: "html-security-scan",
  },
  {
    id: "security.no_external_scripts",
    label: "No external scripts",
    category: "security",
    direction: "boolean",
    unit: "pass",
    applies_to: ["html-static", "html-svg", "html-interactive", "json-renderer", "notebook"],
    source: "html-security-scan",
  },
  {
    id: "security.no_inline_handlers",
    label: "No inline event handlers",
    category: "security",
    direction: "boolean",
    unit: "pass",
    applies_to: ["html-static", "html-svg", "html-interactive", "json-renderer", "notebook"],
    source: "html-security-scan",
  },
  {
    id: "review.diff_noise",
    label: "Normalized diff size",
    category: "reviewability",
    direction: "lower_is_better",
    unit: "normalized-lines",
    applies_to: ALL_FORMATS,
    source: "git-numstat-compatible",
  },
  {
    id: "mutation.expected_impact",
    label: "Expected mutation impact observed",
    category: "mutation_sensitivity",
    direction: "boolean",
    unit: "pass",
    applies_to: ALL_FORMATS,
    source: "mutation-manifest",
  },
];

export const PROFILE_WEIGHTS: Record<string, Record<MetricCategory, number>> = {
  human_review: {
    validity: 15,
    cost: 15,
    render: 20,
    accessibility: 15,
    security: 10,
    reviewability: 20,
    mutation_sensitivity: 5,
  },
  executive_comprehension: {
    validity: 10,
    cost: 5,
    render: 30,
    accessibility: 20,
    security: 5,
    reviewability: 10,
    mutation_sensitivity: 20,
  },
  agent_handoff: {
    validity: 25,
    cost: 20,
    render: 10,
    accessibility: 5,
    security: 15,
    reviewability: 15,
    mutation_sensitivity: 10,
  },
  dashboard: {
    validity: 10,
    cost: 10,
    render: 25,
    accessibility: 20,
    security: 15,
    reviewability: 5,
    mutation_sensitivity: 15,
  },
  regulated_evidence: {
    validity: 25,
    cost: 5,
    render: 10,
    accessibility: 15,
    security: 20,
    reviewability: 15,
    mutation_sensitivity: 10,
  },
};

export function scoreProfiles(categoryScores: Record<MetricCategory, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [profile, weights] of Object.entries(PROFILE_WEIGHTS)) {
    result[profile] =
      Object.entries(weights).reduce(
        (sum, [category, weight]) => sum + categoryScores[category as MetricCategory] * weight,
        0,
      ) / 100;
  }
  return result;
}
