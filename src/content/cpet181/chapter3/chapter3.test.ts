import { describe, expect, it } from "vitest";
import { getActivity } from "../../index";
import { translate } from "@/kinds/shared/figures/memoryTable";
import { ADDRESSES, JOBS, LOCATE, REFERENCES, SEGMENTS, WHOLE, displacementOf, frameStart, pageOf, pagesNeeded, physical, segmentPhysical, wasted } from "./paging";

const COURSE = "cpet181";
const question = (topic: string, activity: string, id: string) => getActivity(COURSE, topic, activity)!.activity.questions.find((q) => q.id === id)!;
const answers = (topic: string, activity: string, id: string) =>
  question(topic, activity, id).variants.map((v) => {
    if (v.spec.kind !== "numeric") throw new Error(`${id}/${v.id}: numeric expected`);
    return v.spec.answer;
  });

describe("CPET 181 Chapter 3 virtual memory content (#611)", () => {
  it("reproduces the slides' worked values", () => {
    // s.7 / s.10: 350 lines, 100 per page, 4 pages, 50 lines wasted
    expect(pagesNeeded({ lines: 350, page: 100 })).toBe(4);
    expect(wasted({ lines: 350, page: 100 })).toBe(50);
    // s.11: 12345 with page size 1024 is page 12, displacement 57
    expect([pageOf({ address: 12345, size: 1024 }), displacementOf({ address: 12345, size: 1024 })]).toEqual([12, 57]);
    // s.13: byte 518 → 1542, byte 25 → 2585 (page size 512, PMT 0 → 5, 1 → 3)
    expect(physical({ size: 512, frames: [5, 3], address: 518 })).toBe(1542);
    expect(physical({ size: 512, frames: [5, 3], address: 25 })).toBe(2585);
    // s.17: 0/50 → 4050, 0/349 → 4349, 1/100 → 7100, 1/199 → 7199, 2/99 → 6099
    const at = (part: number, offset: number) => SEGMENTS[part].at + offset;
    expect([at(0, 50), at(0, 349), at(1, 100), at(1, 199), at(2, 99)]).toEqual([4050, 4349, 7100, 7199, 6099]);
  });

  it("every numeric answer is the data's own, recomputed", () => {
    expect(answers("paged-translation", "pages", "pg.q.pages")).toEqual(JOBS.map((j) => String(Math.ceil(j.lines / j.page))));
    expect(answers("paged-translation", "pages", "pg.q.waste")).toEqual(JOBS.map((j) => String(Math.ceil(j.lines / j.page) * j.page - j.lines)));
    expect(answers("paged-translation", "page-and-displacement", "pg.q.page-number")).toEqual(ADDRESSES.map((a) => String(Math.floor(a.address / a.size))));
    expect(answers("paged-translation", "page-and-displacement", "pg.q.displacement")).toEqual(ADDRESSES.map((a) => String(a.address % a.size)));
    expect(answers("paged-translation", "frame-and-address", "pg.q.frame-start")).toEqual(LOCATE.map((l) => String(frameStart(l))));
    expect(answers("paged-translation", "frame-and-address", "pg.q.physical")).toEqual(LOCATE.map((l) => String(physical(l))));
    expect(answers("paged-translation", "translate", "pg.q.whole")).toEqual(WHOLE.map((l) => String(physical(l))));
    expect(answers("segment-translation", "segment-address", "sg.q.physical")).toEqual(REFERENCES.map((r) => String(segmentPhysical(r))));
  });

  it("the figure's own translation agrees with the answer, and the figure is only drawn as given", () => {
    for (const [topic, activity, id] of [
      ["paged-translation", "translate", "pg.q.whole"],
      ["segment-translation", "segment-address", "sg.q.physical"],
    ]) {
      const q = question(topic, activity, id);
      q.variants.forEach((v, i) => {
        if (v.figure?.type !== "memory-table") throw new Error(`${id}/${v.id}: memory-table figure expected`);
        const t = translate({ table: v.figure.table, size: v.figure.size, rows: v.figure.rows, address: v.figure.address })!;
        expect(String(t.physical), `${id}/${v.id}`).toBe(answers(topic, activity, id)[i]);
      });
    }
  });

  it("the page and the frame misconceptions differ from the answer, and the two splits are not the same number", () => {
    for (const a of ADDRESSES) expect(pageOf(a), `${a.address}/${a.size}`).not.toBe(displacementOf(a));
    for (const l of LOCATE) expect(l.frames[Math.floor(l.address / l.size)] + (l.address % l.size), String(l.address)).not.toBe(physical(l));
  });

  it("calculator is only on the multiplication and the sum, never on quotient and remainder", () => {
    const withCalc = (topic: string, activity: string, id: string) => question(topic, activity, id).variants.every((v) => v.calculator !== undefined);
    expect(withCalc("paged-translation", "frame-and-address", "pg.q.frame-start")).toBe(true);
    expect(withCalc("paged-translation", "frame-and-address", "pg.q.physical")).toBe(true);
    for (const id of ["pg.q.page-number", "pg.q.displacement"]) {
      expect(question("paged-translation", "page-and-displacement", id).variants.some((v) => v.calculator !== undefined), id).toBe(false);
    }
  });

  it("every question has three or four variants and the early hints never contain the answer", () => {
    for (const [topic, activity] of [
      ["virtual-addresses", "addresses"],
      ["virtual-addresses", "pages-and-frames"],
      ["virtual-addresses", "tables"],
      ["virtual-addresses", "address-parts"],
      ["paged-translation", "pages"],
      ["paged-translation", "page-and-displacement"],
      ["paged-translation", "frame-and-address"],
      ["paged-translation", "translate"],
      ["segment-translation", "segment-address"],
      ["paging-segmentation", "paging-vs-segmentation"],
      ["paging-segmentation", "fragmentation"],
      ["paging-segmentation", "virtual-memory"],
    ]) {
      for (const q of getActivity(COURSE, topic, activity)!.activity.questions) {
        expect(q.variants.length, q.id).toBeGreaterThanOrEqual(3);
        expect(q.variants.length, q.id).toBeLessThanOrEqual(4);
        for (const v of q.variants) {
          const early = v.hints.slice(0, -1).map((h) => h.text).join(" ");
          if (v.spec.kind === "multiple-choice") {
            const { options, correctOptionId } = v.spec;
            expect(early, `${q.id}/${v.id}`).not.toContain(options.find((o) => o.id === correctOptionId)!.text);
          } else if (v.spec.kind === "numeric") {
            expect(early.includes(`${v.spec.answer}`) && v.spec.answer.length > 2, `${q.id}/${v.id}`).toBe(false);
          }
        }
      }
    }
  });
});
