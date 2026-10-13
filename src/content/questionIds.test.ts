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
const credited = new Set<string>();
for (const c of courses)
  for (const m of c.modules)
    for (const t of m.topics)
      for (const a of t.activities) {
        live[`${c.id}/${a.id}`] = a.questions.map((q) => q.id);
        for (const q of a.questions) for (const id of q.creditedBy ?? []) credited.add(id);
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
      for (const id of ids) if (!live[activity]?.includes(id) && !credited.has(id) && !RETIRED_WITHOUT_CREDIT[id]) gone.push(`${activity}: ${id}`);
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

  it("creditedBy never names the question itself and has no duplicates", () => {
    const bad: string[] = [];
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics)
          for (const a of t.activities)
            for (const q of a.questions) {
              const ids = q.creditedBy ?? [];
              if (ids.includes(q.id) || new Set(ids).size !== ids.length) bad.push(`${a.id}/${q.id}`);
            }
    expect(bad).toEqual([]);
  });
});
