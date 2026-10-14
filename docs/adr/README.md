# Architecture Decision Records

One file per decision: `NNNN-short-title.md`. Keep each under ~40 lines. Status: Proposed →
Accepted → Superseded by NNNN. Link ADRs from PRs instead of repeating reasoning.

Template:

```markdown
# NNNN — Title
Status: Accepted · Date: YYYY-MM-DD · Owner: <role>

## Context
## Decision
## Consequences
## Alternatives considered
```

| ADR | Title |
|-----|-------|
| 0001 | Web stack |
| 0002 | Content as typed data files |
| 0003 | Rule-based tutor engine, no LLM in v1 |
| 0004 | Native drag and drop |
| 0005 | Guest progress in localStorage |
| 0006 | Agent persistence and wake mechanism |
| 0007 | One step contract for multi-step questions |
| 0008 | One module per interaction kind, loaded on demand |
| 0009 | Figures on the variant |
| 0010 | Team V2 and one dispatcher |
| 0011 | Arabic for supportive text, English for everything else |
| 0012 | Educational Integrity & Learner Experience Auditor (amends 0010) |
| 0013 | Meaningful progress: what `started` and `lastAt` mean (amends 0005) |
| 0014 | Declared entries: a self-contained question may be opened directly (amends 0007, 0008) |
