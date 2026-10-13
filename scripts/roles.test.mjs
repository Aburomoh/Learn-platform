import assert from "node:assert/strict";
import test from "node:test";
import { ROLES, labelRole, roleOf } from "./roles.mjs";

test("the Educational Integrity Auditor is a permanent role (ADR-0012)", () => {
  assert.equal(roleOf("auditor"), "educational-auditor");
  assert.equal(roleOf("educational-auditor"), "educational-auditor");
  assert.equal(labelRole("wake:auditor"), "educational-auditor");
  assert.equal(ROLES["educational-auditor"].onDemand, undefined);
  assert.equal(ROLES["educational-auditor"].charter, "educational_auditor");
});

test("audit:critical reaches the Lead; other audit labels wake nobody", () => {
  assert.equal(labelRole("audit:critical"), "lead");
  for (const l of ["audit", "audit:major", "audit:minor"]) assert.equal(labelRole(l), undefined);
});

test("every role has a unique alarm label and short name", () => {
  const alarms = Object.values(ROLES).map((r) => r.alarm);
  assert.equal(new Set(alarms).size, alarms.length);
  for (const [slug, r] of Object.entries(ROLES)) assert.equal(roleOf(r.alarm.slice(5)), slug);
  assert.equal(roleOf("tech-lead"), "lead"); // retired V1 names still resolve
});
