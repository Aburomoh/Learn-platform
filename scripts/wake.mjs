#!/usr/bin/env node
// Prints everything a role needs to start working (ADR-0006).
// Usage: npm run wake <role>   e.g. npm run wake technical-lead
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";

const ROLES = {
  "product-engineering-director": { file: "product_engineering_director", labels: ["blocked", "owner-decision"] },
  "product-manager": { file: "product_manager", labels: ["wake:product-manager", "blocked:product"] },
  "pedagogy-engineer": { file: "pedagogy_engineer", labels: ["pedagogy-review"] },
  "ux-design-engineer": { file: "ux_design_engineer", labels: [] },
  "technical-lead": { file: "technical_lead", labels: ["wake:tech-lead", "blocked:architecture"] },
  "frontend-interaction-engineer": { file: "frontend_interaction_engineer", labels: ["ready"] },
  "backend-data-engineer": { file: "backend_data_engineer", labels: ["ready"] },
  "ai-tutor-engineer": { file: "ai_tutor_engineer", labels: ["ready"] },
  "code-architecture-reviewer": { file: "code_architecture_reviewer", labels: ["wake:reviewer"] },
  "qa-test-engineer": { file: "qa_test_engineer", labels: ["wake:qa"] },
  "security-privacy-engineer": { file: "security_privacy_engineer", labels: ["security-sensitive"] },
  "performance-stress-engineer": { file: "performance_stress_engineer", labels: ["performance-risk"] },
  "release-devops-engineer": { file: "release_devops_engineer", labels: ["release-ready"] },
};

const role = process.argv[2];
if (!role || !ROLES[role]) {
  console.error("Usage: npm run wake <role>\nRoles:\n  " + Object.keys(ROLES).join("\n  "));
  process.exit(1);
}
const { file, labels } = ROLES[role];
const show = (title, path) => {
  console.log(`\n=== ${title} (${path}) ===`);
  console.log(existsSync(path) ? readFileSync(path, "utf8").trim() : "(missing)");
};
show("CHARTER", `agents/${file}.md`);
show("STATE", `agents/state/${file}.md`);

console.log("\n=== ACTIVE ADRs ===");
for (const f of readdirSync("docs/adr").filter((n) => /^\d{4}-/.test(n))) console.log("  docs/adr/" + f);

console.log("\n=== OPEN ITEMS ===");
try {
  const open = [];
  for (const label of labels) {
    const q = `gh issue list --state open --label "${label}" --json number,title,url --limit 20`;
    const prs = `gh pr list --state open --label "${label}" --json number,title,url --limit 20`;
    for (const cmd of [q, prs]) {
      const out = JSON.parse(execSync(cmd, { encoding: "utf8" }) || "[]");
      for (const it of out) open.push(`  [${label}] #${it.number} ${it.title}  ${it.url}`);
    }
  }
  console.log(open.length ? open.join("\n") : "  (none)");
} catch {
  console.log("  (gh unavailable or not authenticated)");
}
console.log("\nStart in a task branch. Update agents/state/" + file + ".md minimally before stopping.");
