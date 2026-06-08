import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020Module from "ajv/dist/2020.js";

import { loadCanonicalCase } from "./case/loadCase.ts";
import { METRIC_REGISTRY } from "./evaluate/metrics.ts";

export async function validateProject(): Promise<void> {
  type CompiledValidator = ((data: unknown) => boolean) & { errors?: unknown };
  const Ajv2020 = Ajv2020Module as unknown as new (options: { allErrors: boolean }) => {
    compile(schema: unknown): CompiledValidator;
  };
  const ajv = new Ajv2020({ allErrors: true });
  const canonicalSchema = JSON.parse(readFileSync(join(process.cwd(), "schemas", "canonical-case.schema.json"), "utf8"));
  const metricSchema = JSON.parse(readFileSync(join(process.cwd(), "schemas", "metric-manifest.schema.json"), "utf8"));
  const canonical = await loadCanonicalCase("prior-auth");

  const validateCanonical = ajv.compile(canonicalSchema);
  if (!validateCanonical(canonical)) {
    throw new Error(`canonical case invalid: ${JSON.stringify(validateCanonical.errors)}`);
  }

  const validateMetric = ajv.compile(metricSchema);
  for (const metric of METRIC_REGISTRY) {
    if (!validateMetric(metric)) {
      throw new Error(`metric invalid: ${metric.id}: ${JSON.stringify(validateMetric.errors)}`);
    }
  }
}
