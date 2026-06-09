# Scoring Rubric

All five profiles are transparent weight vectors over the same per-format metric categories.

The categories intentionally keep the HTML-versus-Markdown tradeoff visible. HTML can gain from
render, reviewability, visual correctness, and interaction success. Markdown can gain from cost and
source simplicity. A profile winner is therefore a statement about a use case, not a universal
artifact ranking.

| Metric category | Human reviewer | Agent reader | Security sensitive | Accessibility first | Cost sensitive |
|---|---:|---:|---:|---:|---:|
| Validity | 15 | 25 | 10 | 10 | 10 |
| Cost | 10 | 15 | 5 | 5 | 35 |
| Render | 15 | 10 | 10 | 15 | 10 |
| Accessibility | 15 | 5 | 10 | 35 | 10 |
| Security | 10 | 15 | 35 | 10 | 10 |
| Reviewability | 20 | 10 | 10 | 5 | 15 |
| Mutation sensitivity | 5 | 10 | 15 | 10 | 5 |
| Comprehension | 10 | 10 | 5 | 10 | 5 |

## Category notes

- `validity`: stable metadata and format-specific validity, including notebook structure.
- `cost`: bytes, lines, and token estimates. Lower-cost artifacts score higher.
- `render`: page load, visible sections, and interaction smoke checks for rendered formats.
- `accessibility`: automated signals such as serious/critical findings and SVG accessible names.
- `security`: CSP, external request/script checks, inline handler checks, and sanitizer markers.
- `reviewability`: source compactness plus affordance signals such as navigation and annotations.
- `mutation_sensitivity`: whether expected factual, visual, accessibility, or security mutations are observed.
- `comprehension`: answer accuracy, findability landmarks, visual edge correctness, and interaction success.
