# Security Model

Security in v0.1 means artifact sandbox hygiene, not a complete application security review.

The normal benchmark is API-key-free. Agent-corpus artifacts are checked in and evaluated locally;
no provider calls occur during verification.

| Check | Applies to | Pass condition |
|---|---|---|
| No external network | all browser-rendered formats | browser checks see no external requests |
| No external scripts | HTML formats | no remote `<script src>` |
| CSP present | HTML formats/site | strict `default-src`, `script-src`, `style-src` policy |
| No inline event handlers | HTML formats | no `onclick`, `onload`, or equivalent handlers |
| DOMPurify usage | renderer/interactive paths that inject HTML | sanitizer marker present and tested |
| Unsafe mutation detection | security mutation | expected security score drops |
