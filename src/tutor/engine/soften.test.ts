import { describe, expect, it } from "vitest";
import { softenNudge } from "./soften";
import { reduce } from "./reduce";
import { initialTutorState, type ActivityContext, type TutorState } from "./state";
import { contextFromVariant } from "../context";
import { placeValue45 } from "@/content/fixtures/placeValue45";
import type { LearningEvent } from "./events";
import type { TutorAction } from "./actions";

const base = contextFromVariant(placeValue45);
const ctx: ActivityContext = {
  ...base,
  hints: [
    { rung: 2, text: "Not yet. Do {dividend} ÷ 2 carefully." },
    { rung: 3, text: "Each step: divide by 2." },
  ],
  vars: { ...base.vars, dividend: 26 },
};

function run(events: LearningEvent[], start: TutorState = initialTutorState) {
  let state = start;
  const actions: TutorAction[] = [];
  for (const e of events) {
    const r = reduce(state, e, ctx);
    state = r.state;
    actions.push(...r.actions);
  }
  return { state, actions };
}
const revealed = (actions: TutorAction[]) => actions.flatMap((a) => (a.type === "REVEAL_HINT" ? [a] : []));

describe("a nudge before any Check carries no verdict (#717)", () => {
  it("softenNudge drops a leading verdict in English and Arabic and keeps the rest", () => {
    expect(softenNudge("Not yet. Do 26 ÷ 2 carefully.")).toBe("Do 26 ÷ 2 carefully.");
    expect(softenNudge("Not quite. Look at the signs again.")).toBe("Look at the signs again.");
    expect(softenNudge("ليس بعد. احسب 26 ÷ 2 بدقة.")).toBe("احسب 26 ÷ 2 بدقة.");
    expect(softenNudge("ليس تماماً. انظر مرة أخرى.")).toBe("انظر مرة أخرى.");
    expect(softenNudge("Not that one. Count the inputs first.")).toBe("Count the inputs first.");
    expect(softenNudge("ليس هذا. احسب عدد Inputs أولاً.")).toBe("احسب عدد Inputs أولاً.");
    expect(softenNudge("Each step: divide by 2.")).toBe("Each step: divide by 2.");
    expect(softenNudge("It is not yet time.")).toBe("It is not yet time.");
  });

  it("I am stuck on a fresh step answers without 'Not yet'", () => {
    const r = run([{ type: "STUCK_REQUESTED" }]);
    const [h] = revealed(r.actions);
    expect(h.rung).toBe(2);
    expect(h.text).toBe("Do 26 ÷ 2 carefully.");
    expect(h.unchecked).toBe(true);
    expect(h.template).toBe("Not yet. Do {dividend} ÷ 2 carefully."); // the approved string, for the Arabic lookup
  });

  it("a Hint after an unchecked edit is softened too", () => {
    const r = run([{ type: "ENGAGED" }, { type: "HINT_REQUESTED" }]);
    expect(revealed(r.actions)[0].text).toBe("Do 26 ÷ 2 carefully.");
  });

  it("after a wrong Check the verdict stays: the answer was marked", () => {
    const r = run([{ type: "ANSWER_SUBMITTED", correct: false }, { type: "HINT_REQUESTED" }]);
    const h = revealed(r.actions).find((a) => a.rung === 2);
    expect(h?.text).toBe("Not yet. Do 26 ÷ 2 carefully.");
    expect(h?.unchecked).toBeUndefined();
  });
});
