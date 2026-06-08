import assert from "node:assert/strict";
import test from "node:test";

import { scanHtmlSecurity } from "../../src/security/htmlSecurity.ts";

test("scanHtmlSecurity accepts sandboxed local HTML", () => {
  const html = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'self'"><h1>Safe</h1><script type="application/json">{}</script>`;

  const result = scanHtmlSecurity(html, { requiresSanitizer: false });

  assert.equal(result.passed, true);
  assert.equal(result.violations.length, 0);
});

test("scanHtmlSecurity rejects remote scripts and inline handlers", () => {
  const html = `<!doctype html><h1 onclick="alert(1)">Unsafe</h1><script src="https://example.com/x.js"></script>`;

  const result = scanHtmlSecurity(html, { requiresSanitizer: true });

  assert.equal(result.passed, false);
  assert.ok(result.violations.includes("missing_csp"));
  assert.ok(result.violations.includes("remote_script"));
  assert.ok(result.violations.includes("inline_event_handler"));
  assert.ok(result.violations.includes("missing_sanitizer_marker"));
});
