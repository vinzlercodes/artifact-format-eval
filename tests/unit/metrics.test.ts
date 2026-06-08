import assert from "node:assert/strict";
import test from "node:test";

import type { MetricCategory } from "../../src/types.ts";
import { METRIC_REGISTRY, PROFILE_WEIGHTS, scoreProfiles } from "../../src/evaluate/metrics.ts";

test("metric registry includes required categories and valid metric declarations", () => {
  const categories = new Set(METRIC_REGISTRY.map((metric) => metric.category));

  const expectedCategories: MetricCategory[] = [
    "validity",
    "cost",
    "render",
    "accessibility",
    "security",
    "reviewability",
    "mutation_sensitivity",
    "comprehension",
  ];
  for (const category of expectedCategories) {
    assert.ok(categories.has(category), `missing metric category ${category}`);
  }

  for (const metric of METRIC_REGISTRY) {
    assert.match(metric.id, /^[a-z0-9_.-]+$/);
    assert.ok(metric.applies_to.length > 0);
    assert.ok(["lower_is_better", "higher_is_better", "boolean"].includes(metric.direction));
  }
});

test("profile weights sum to 100", () => {
  for (const [profile, weights] of Object.entries(PROFILE_WEIGHTS)) {
    const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
    assert.equal(total, 100, `${profile} weights should sum to 100`);
  }
});

test("scoreProfiles creates one transparent score per profile", () => {
  const scores = scoreProfiles({
    validity: 1,
    cost: 0.5,
    render: 0.75,
    accessibility: 1,
    security: 1,
    reviewability: 0.25,
    mutation_sensitivity: 0.5,
    comprehension: 0.8,
  });

  assert.deepEqual(Object.keys(scores).sort(), Object.keys(PROFILE_WEIGHTS).sort());
  assert.ok(scores.cost_sensitive > 0);
});
