import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

import { runBenchmark } from "../../src/benchmark.ts";

const baselineDir = join(process.cwd(), "results", "prior-auth", "baseline");
const mutationDir = join(
  process.cwd(),
  "results",
  "prior-auth",
  "mutations",
  "accessibility-error",
);

const baselineArtifacts = [
  "artifact.html",
  "artifact-svg.html",
  "artifact-interactive.html",
] as const;

test.setTimeout(120_000);

test.beforeAll(async () => {
  await runBenchmark({ caseId: "prior-auth", source: "templates" });
});

test("baseline HTML artifacts load from file URLs", async ({ page }) => {
  for (const artifact of baselineArtifacts) {
    const artifactPath = join(baselineDir, artifact);

    await page.goto(pathToFileURL(artifactPath).href, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator("h1")).toBeVisible();
  }
});

test("baseline HTML artifacts make no external http requests", async ({
  page,
}) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (/^https?:\/\//i.test(request.url()))
      externalRequests.push(request.url());
  });

  for (const artifact of baselineArtifacts) {
    await page.goto(pathToFileURL(join(baselineDir, artifact)).href, {
      waitUntil: "domcontentloaded",
    });
  }

  expect(externalRequests).toEqual([]);
});

test("interactive included filter changes visible state", async ({ page }) => {
  await page.goto(
    pathToFileURL(join(baselineDir, "artifact-interactive.html")).href,
    {
      waitUntil: "domcontentloaded",
    },
  );

  const visibleBefore = await page.locator(".card:visible").count();

  await page.locator('button[data-filter="included"]').click();

  await expect(page.locator("#interaction-result")).toHaveText(
    "Focused included",
  );
  await expect(page.locator(".fact").first()).toBeHidden();
  await expect(page.locator(".risk").first()).toBeHidden();
  await expect(page.locator(".evidence").first()).toBeVisible();
  await expect
    .poll(() => page.locator(".card:visible").count())
    .toBeLessThan(visibleBefore);
});

test("accessibility mutation writes html-svg runtime degradation evidence", () => {
  const runtimePath = join(mutationDir, "runtime.by-format.json");

  expect(existsSync(runtimePath)).toBe(true);

  const runtime = JSON.parse(readFileSync(runtimePath, "utf8")) as {
    formats: {
      "html-svg": {
        axe_serious_or_critical: number;
        svg_has_accessible_name: boolean | null;
      };
    };
  };

  expect(runtime.formats["html-svg"].svg_has_accessible_name).toBe(false);
  expect(runtime.formats["html-svg"].axe_serious_or_critical).toBeGreaterThan(
    0,
  );
});
