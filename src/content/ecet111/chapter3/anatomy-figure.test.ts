import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";

describe("K-map anatomy questions show the map they name (#618)", () => {
  const questions = getActivity("ecet111", "kmap-anatomy", "kmap-anatomy")!.activity.questions;

  it("every cell and region variant draws the blank map with its row and column labels, and no minterm numbers", () => {
    for (const q of questions.filter((x) => x.id === "km.q.cell" || x.id === "km.q.region")) {
      for (const v of q.variants) {
        if (v.figure?.type !== "table") throw new Error(`${q.id}/${v.id}: table figure expected`);
        const { columns } = v.figure;
        const body = columns.slice(1).flatMap((c) => c.values);
        expect(new Set(body), `${q.id}/${v.id}`).toEqual(new Set(["·"]));
        expect(columns[0].values.length, `${q.id}/${v.id}`).toBeGreaterThanOrEqual(2);
        // column labels run in Gray order, as the pack draws them
        expect(columns.slice(1).map((c) => c.header).join(" ")).toMatch(/^(0 1|00 01 11 10)$/);
        expect(v.prompt, `${q.id}/${v.id}`).toMatch(/^On this \d-variable map/);
      }
    }
  });
});
