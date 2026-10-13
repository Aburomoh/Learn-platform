import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { courses } from "@/content";

/**
 * Question ids are permanent (ADR-0002, learning architecture §6.1, #692): stored progress holds them.
 * `question-ids.snapshot.json` lists every question id per practice. An id may disappear only when a live
 * question lists it in `creditedBy`, or it is named in RETIRED_WITHOUT_CREDIT with a reason. The snapshot
 * is updated in the same PR (`UPDATE_QUESTION_IDS=1 npx vitest run src/content/questionIds.test.ts`), so
 * the change is visible in review. The snapshot keeps retired ids too, so they can never be reused.
 */
const FILE = path.resolve(process.cwd(), "src/content/question-ids.snapshot.json");

/** Ids retired with no successor, with the reason. Empty: nothing has been retired yet. */
const RETIRED_WITHOUT_CREDIT: Record<string, string> = {};

const live: Record<string, string[]> = {};
// credit is resolved per practice (effectiveDone reads one practice's record), so it is keyed by practice
const credited: Record<string, Set<string>> = {};
for (const c of courses)
  for (const m of c.modules)
    for (const t of m.topics)
      for (const a of t.activities) {
        const key = `${c.id}/${a.id}`;
        live[key] = a.questions.map((q) => q.id);
        credited[key] = new Set(a.questions.flatMap((q) => q.creditedBy ?? []));
      }

describe("question ids are permanent (#692)", () => {
  if (process.env.UPDATE_QUESTION_IDS) {
    it("writes the snapshot", () => {
      const prev: Record<string, string[]> = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};
      const next: Record<string, string[]> = {};
      for (const k of Object.keys({ ...prev, ...live }).sort()) next[k] = [...new Set([...(prev[k] ?? []), ...(live[k] ?? [])])];
      writeFileSync(FILE, JSON.stringify(next, null, 2) + "\n");
    });
    return;
  }
  const snapshot: Record<string, string[]> = JSON.parse(readFileSync(FILE, "utf8"));

  it("every snapshot id is still live, credited by a live question, or retired with a reason", () => {
    const gone: string[] = [];
    for (const [activity, ids] of Object.entries(snapshot))
      for (const id of ids) if (!live[activity]?.includes(id) && !credited[activity]?.has(id) && !RETIRED_WITHOUT_CREDIT[id]) gone.push(`${activity}: ${id}`);
    expect(gone).toEqual([]);
  });

  it("every live id is in the snapshot (run with UPDATE_QUESTION_IDS=1 when a question is added)", () => {
    const fresh: string[] = [];
    for (const [activity, ids] of Object.entries(live)) for (const id of ids) if (!snapshot[activity]?.includes(id)) fresh.push(`${activity}: ${id}`);
    expect(fresh).toEqual([]);
  });

  it("an id retired without credit is not live again", () => {
    for (const id of Object.keys(RETIRED_WITHOUT_CREDIT)) expect(Object.values(live).flat(), id).not.toContain(id);
  });

  it("creditedBy names ids of the same practice (live or in the snapshot), never itself, no duplicates", () => {
    const bad: string[] = [];
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics)
          for (const a of t.activities)
            for (const q of a.questions) {
              const ids = q.creditedBy ?? [];
              const known = new Set([...(snapshot[`${c.id}/${a.id}`] ?? []), ...live[`${c.id}/${a.id}`]]);
              if (ids.includes(q.id) || new Set(ids).size !== ids.length) bad.push(`${a.id}/${q.id}: itself or duplicate`);
              for (const id of ids) if (!known.has(id)) bad.push(`${a.id}/${q.id}: ${id} was never a question of this practice`);
            }
    expect(bad).toEqual([]);
  });
});
