// Team V2 roles (owner, 2026-10-06; ADR-0010). Five permanent roles, six on-demand specialists.
// `alarm` wakes the role; `labels` are its other triggers; `retired` maps old Team V1 names and labels
// to their new owner, so old commands and labels keep working during the migration.
export const ROLES = {
  lead: { title: "Lead", alarm: "wake:lead", labels: ["blocked:architecture", "blocked:product", "blocked", "owner-decision"], charter: "lead" },
  "content-engineer": { title: "Content Engineer", alarm: "wake:content", labels: [], charter: "content_engineer" },
  "ui-engineer": { title: "UI / Interaction Engineer", alarm: "wake:ui", labels: [], charter: "ui_engineer" },
  "code-architecture-reviewer": { title: "Independent Reviewer", alarm: "wake:reviewer", labels: [], charter: "code_architecture_reviewer" },
  "qa-test-engineer": { title: "Independent QA", alarm: "wake:qa", labels: [], charter: "qa_test_engineer" },
  // On demand: no permanent session; their wakes are routed to the Lead's inbox.
  "pedagogy-engineer": { title: "Pedagogy (on demand)", alarm: "wake:pedagogy", labels: ["pedagogy-review"], charter: "pedagogy_engineer", onDemand: true },
  "ux-design-engineer": { title: "UX / Design (Fable, on demand)", alarm: "wake:ux", labels: [], charter: "ux_design_engineer", onDemand: true },
  "course-material-analyst": { title: "Material Analyst (on demand)", alarm: "wake:material", labels: [], charter: "course_material_analyst", onDemand: true },
  "security-privacy-engineer": { title: "Security (on demand)", alarm: "wake:security", labels: ["security-sensitive"], charter: "security_privacy_engineer", onDemand: true },
  "performance-stress-engineer": { title: "Performance (on demand)", alarm: "wake:performance", labels: ["performance-risk"], charter: "performance_stress_engineer", onDemand: true },
  "release-devops-engineer": { title: "DevOps (on demand)", alarm: "wake:devops", labels: ["release-ready"], charter: "release_devops_engineer", onDemand: true },
};

// Team V1 names and labels → Team V2 owner.
export const RETIRED = {
  "technical-lead": "lead", "tech-lead": "lead", "product-manager": "lead", "product-engineering-director": "lead", director: "lead",
  "backend-data-engineer": "content-engineer", backend: "content-engineer", "ai-tutor-engineer": "content-engineer", tutor: "content-engineer",
  "frontend-interaction-engineer": "ui-engineer", frontend: "ui-engineer",
};

const SHORT = Object.fromEntries(Object.entries(ROLES).map(([slug, r]) => [r.alarm.slice("wake:".length), slug]));

/** A role slug, short name (label suffix) or retired Team V1 name → the Team V2 role slug. */
export const roleOf = (name) => (ROLES[name] ? name : SHORT[name] ?? RETIRED[name]);

/** The Team V2 role a label belongs to (old V1 wake labels map to their new owner). */
export function labelRole(label) {
  for (const [slug, r] of Object.entries(ROLES)) if (r.alarm === label || r.labels.includes(label)) return slug;
  if (label.startsWith("wake:")) return RETIRED[label.slice(5)];
  return undefined;
}
