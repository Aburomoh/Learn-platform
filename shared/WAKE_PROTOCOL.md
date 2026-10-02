# Wake / Trigger Protocol

Wake operations must be idempotent.

## Normal Flow
TASK READY → responsible engineer  
PR OPENED → Code / Architecture Reviewer  
REVIEW APPROVED → QA / Test Engineer  
QA PASSED → Technical Lead  
MERGED → Product Manager

## Escalation
BLOCKED:ARCHITECTURE → Technical Lead  
BLOCKED:PRODUCT → Product Manager  
PEDAGOGY_REVIEW → Educational / Pedagogy Engineer  
SECURITY_SENSITIVE → Security / Privacy Engineer  
PERFORMANCE_RISK → Performance / Stress Engineer  
RELEASE_READY → Release / DevOps Engineer

## Mechanism
GitHub labels applied idempotently by `.github/workflows/wake.yml` (ADR-0006): `wake:reviewer`, `wake:qa`, `wake:tech-lead`, `wake:product-manager`. Escalation labels are applied manually: `blocked:architecture`, `blocked:product`, `pedagogy-review`, `security-sensitive`, `performance-risk`, `release-ready`. QA marks a PR `qa:passed`; once CI is green the workflow wakes the Technical Lead. `npm run wake <role>` shows a role its open items.

## Reliability
Triggers should be implemented by scripts/hooks/actions supported by the execution environment. Re-running the same trigger must not create duplicate competing assignments.
