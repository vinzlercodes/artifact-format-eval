export interface HtmlSecurityResult {
  passed: boolean;
  violations: string[];
}

interface ScanOptions {
  requiresSanitizer: boolean;
}

export function scanHtmlSecurity(html: string, options: ScanOptions): HtmlSecurityResult {
  const violations: string[] = [];
  const cspMatch = html.match(/Content-Security-Policy"\s+content="([^"]+)"/i);
  if (!cspMatch) {
    violations.push("missing_csp");
  } else {
    const csp = cspMatch[1];
    for (const directive of ["default-src", "script-src", "style-src"]) {
      if (!csp.includes(directive)) {
        violations.push(`csp_missing_${directive}`);
      }
    }
  }

  if (/<script[^>]+src=["']https?:\/\//i.test(html)) {
    violations.push("remote_script");
  }
  if (/\son[a-z]+\s*=/i.test(html)) {
    violations.push("inline_event_handler");
  }
  if (
    /https?:\/\//i.test(html.replace(/https:\/\/json-schema\.org\/draft\/2020-12\/schema/g, "")) &&
    /<script|<img|<link/i.test(html)
  ) {
    violations.push("external_network_reference");
  }
  if (options.requiresSanitizer && !/data-sanitizer=["']DOMPurify["']|DOMPurify/i.test(html)) {
    violations.push("missing_sanitizer_marker");
  }

  return { passed: violations.length === 0, violations };
}
