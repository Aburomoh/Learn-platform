import { describe, expect, it } from "vitest";
import { reduce } from "./reduce";
import { initialTutorState, canRequestScaffold, type TutorState, type ActivityContext } from "./state";
import type { LearningEvent } from "./events";
import type { TutorAction } from "./actions";
import { contextFromVariant } from "../context";
import { hasMessage } from "../messages";
import { courses } from "@/content";
import { placeValue45 } from "@/content/fixtures/placeValue45";

const variant = placeValue45;
const ctx: ActivityContext = contextFromVariant(variant);

function run(events: LearningEvent[], start: TutorState = initialTutorState, c = ctx) {
  let state = start;
  const all: TutorAction[] = [];
  for (const e of events) {
    const r = reduce(state, e, c);
    state = r.state;
    all.push(...r.actions);
  }
  return { state, actions: all };
}
const says = (actions: TutorAction[]) => actions.filter((a): a is Extract<TutorAction, { type: "SAY" }> => a.type === "SAY");
const types = (actions: TutorAction[]) => actions.map((a) => a.type);

describe("tutor engine: core rules", () => {
  it("is pure and deterministic", () => {
    const a = reduce(initialTutorState, { type: "ANSWER_SUBMITTED", correct: false }, ctx);
    const b = reduce(initialTutorState, { type: "ANSWER_SUBMITTED", correct: false }, ctx);
    expect(a).toEqual(b);
    expect(initialTutorState.attempts).toBe(0);
  });

  it("rule 1: first wrong answer nudges, changes expression, requests retry, never reveals a hint", () => {
    const { state, actions } = run([{ type: "ACTIVITY_OPENED" }, { type: "ANSWER_SUBMITTED", correct: false }]);
    expect(state.stage).toBe("await_retry");
    expect(state.attempts).toBe(1);
    expect(state.hintLevel).toBe(0);
    expect(types(actions)).not.toContain("REVEAL_HINT");
    expect(actions).toContainEqual({ type: "CHANGE_EXPRESSION", expression: "thinking" });
    expect(types(actions)).toContain("REQUEST_RETRY");
    expect(says(actions).at(-1)?.messageKey).toBe("wrong.first");
  });

  it("rule 1: a recognised misconception gets its specific nudge with variables filled", () => {
    const { actions } = run([{ type: "ANSWER_SUBMITTED", correct: false, misconceptionId: "ns.skip-largest" }]);
    const last = says(actions).at(-1)!;
    expect(last.messageKey).toBe("ns.missing-largest");
    expect(last.text).toContain("32");
    expect(last.text).toContain("45");
    expect(last.text).not.toMatch(/\{/);
  });

  it("rule 2: second wrong answer grants the concept reminder (rung 3) and focuses the declared target", () => {
    const { state, actions } = run([
      { type: "ANSWER_SUBMITTED", correct: false },
      { type: "ANSWER_SUBMITTED", correct: false },
    ]);
    expect(state.hintLevel).toBe(3);
    expect(actions.filter((a) => a.type === "REVEAL_HINT")).toHaveLength(1);
    expect(actions).toContainEqual({ type: "FOCUS", target: "slot-32" });
  });

  it("rule 3: hints advance one rung per request; visual rungs add HIGHLIGHT and PULSE", () => {
    const { state, actions } = run([
      { type: "ANSWER_SUBMITTED", correct: false },
      { type: "HINT_REQUESTED" },
      { type: "HINT_REQUESTED" },
      { type: "HINT_REQUESTED" },
      { type: "HINT_REQUESTED" },
    ]);
    expect(state.grantedRungs).toEqual([2, 3, 4, 5]);
    expect(actions).toContainEqual({ type: "HIGHLIGHT", target: "slot-32" });
    expect(actions).toContainEqual({ type: "PULSE", target: "slot-32" });
  });

  it("gate: no hint or explanation before the first attempt (unless hesitating)", () => {
    const h = run([{ type: "HINT_REQUESTED" }]);
    expect(h.state.hintLevel).toBe(0);
    expect(says(h.actions).at(-1)?.messageKey).toBe("hint.try-first");
    const e = run([{ type: "EXPLAIN_SLOWLY_REQUESTED" }]);
    expect(e.state.stage).toBe("await_answer");
    expect(canRequestScaffold(initialTutorState)).toBe(false);
  });

  it("rule 4: hesitation over 45 s prompts once, then unlocks scaffolds", () => {
    const { state, actions } = run([
      { type: "HESITATION", seconds: 20 },
      { type: "HESITATION", seconds: 50 },
      { type: "HESITATION", seconds: 90 },
    ]);
    expect(says(actions).filter((s) => s.messageKey === "hesitation")).toHaveLength(1);
    expect(actions).toContainEqual({ type: "CHANGE_EXPRESSION", expression: "curious" });
    expect(canRequestScaffold(state)).toBe(true);
  });

  it("hints exhausted: suggests explain slowly instead of revealing more", () => {
    const start: TutorState = { ...initialTutorState, attempts: 1, stage: "await_retry", hintLevel: 9 };
    const { actions } = run([{ type: "HINT_REQUESTED" }], start);
    expect(says(actions).at(-1)?.messageKey).toBe("hints.exhausted");
  });

  it("rule 5: Explain Slowly walks steps, asks predictions, reacts, then hands back for a retry", () => {
    const steps = ctx.explanation.length;
    const events: LearningEvent[] = [{ type: "ANSWER_SUBMITTED", correct: false }, { type: "EXPLAIN_SLOWLY_REQUESTED" }];
    let r = run(events);
    expect(r.state.stage).toBe("explaining");
    expect(r.actions).toContainEqual({ type: "ADVANCE_EXPLANATION", step: 0 });
    expect(r.actions).toContainEqual({ type: "CHANGE_EXPRESSION", expression: "explaining" });

    // step 0 has no ask; step 1 asks.
    r = run([{ type: "EXPLANATION_STEP_DONE" }], r.state);
    expect(r.actions).toContainEqual({ type: "ASK", stepId: "s2" });
    r = run([{ type: "PREDICTION_MADE", correct: true }], r.state);
    expect(r.actions).toContainEqual({ type: "CHANGE_EXPRESSION", expression: "pleased" });
    expect(says(r.actions).at(-1)?.text).toContain("13 remains");
    r = run([{ type: "PREDICTION_MADE", correct: false }], { ...r.state, explanationStep: 2 });
    expect(says(r.actions).at(-1)?.messageKey).toBe("prediction.wrong");

    // finish all steps
    let st = { ...r.state, explanationStep: 2 };
    for (let i = 2; i < steps; i++) st = run([{ type: "EXPLANATION_STEP_DONE" }], st).state;
    expect(st.stage).toBe("await_retry");
    const done = run([{ type: "EXPLANATION_STEP_DONE" }], { ...st, stage: "explaining", explanationStep: steps - 1 });
    expect(types(done.actions)).toEqual(expect.arrayContaining(["RESET_INTERACTION", "REQUEST_RETRY"]));
    expect(says(done.actions).at(-1)?.messageKey).toBe("explain.done");
  });

  it("rule 5 (#42): with another variant available, the explanation ends by switching numbers", () => {
    const c = { ...ctx, hasOtherVariant: true };
    let st: TutorState = run([{ type: "ANSWER_SUBMITTED", correct: false }, { type: "HINT_REQUESTED" }, { type: "EXPLAIN_SLOWLY_REQUESTED" }], initialTutorState, c).state;
    let last: TutorAction[] = [];
    while (st.stage === "explaining") ({ state: st, actions: last } = run([{ type: "EXPLANATION_STEP_DONE" }], st, c));
    expect(types(last)).toEqual(expect.arrayContaining(["SWITCH_VARIANT", "RESET_INTERACTION", "REQUEST_RETRY"]));
    expect(types(last).indexOf("SWITCH_VARIANT")).toBeLessThan(types(last).indexOf("RESET_INTERACTION"));
    expect(says(last).at(-1)?.messageKey).toBe("explain.done-variant");
    expect(st).toMatchObject({ stage: "await_answer", attempts: 0, hintLevel: 0, grantedRungs: [], hintsEverUsed: true });
    // a later correct answer on the new numbers still counts as helped
    expect(says(run([{ type: "ANSWER_SUBMITTED", correct: true }], st, c).actions).at(-1)?.messageKey).toBe("correct.after-hints");
  });

  it("rule 6: correct answer completes; after hints it invites a similar one", () => {
    const clean = run([{ type: "ANSWER_SUBMITTED", correct: true }]);
    expect(clean.state.stage).toBe("complete");
    expect(types(clean.actions)).toContain("COMPLETE");
    expect(says(clean.actions).at(-1)?.messageKey).toBe("correct");
    const hinted = run([{ type: "ANSWER_SUBMITTED", correct: false }, { type: "HINT_REQUESTED" }, { type: "ANSWER_SUBMITTED", correct: true }]);
    expect(says(hinted.actions).at(-1)?.messageKey).toBe("correct.after-hints");
    expect(hinted.actions).toContainEqual({ type: "CHANGE_EXPRESSION", expression: "pleased" });
  });

  it("retry with a new variant resets per-variant state", () => {
    const { state, actions } = run([{ type: "ANSWER_SUBMITTED", correct: false }, { type: "HINT_REQUESTED" }, { type: "RETRY_REQUESTED", newVariant: true }]);
    expect(state.attempts).toBe(0);
    expect(state.hintLevel).toBe(0);
    expect(types(actions)).toContain("RESET_INTERACTION");
  });

  it("ignores answers while explaining or after completion", () => {
    const done = run([{ type: "ANSWER_SUBMITTED", correct: true }, { type: "ANSWER_SUBMITTED", correct: false }]);
    expect(done.state.attempts).toBe(1);
    const explaining = run([{ type: "ANSWER_SUBMITTED", correct: false }, { type: "EXPLAIN_SLOWLY_REQUESTED" }, { type: "ANSWER_SUBMITTED", correct: true }]);
    expect(explaining.state.stage).toBe("explaining");
  });
});

describe("tutor engine: multi-step questions", () => {
  it("STEP_COMPLETED restarts the ladder, keeps the question open and remembers hint use", () => {
    const { state, actions } = run([{ type: "ANSWER_SUBMITTED", correct: false }, { type: "HINT_REQUESTED" }, { type: "STEP_COMPLETED" }]);
    expect(state).toMatchObject({ stage: "await_answer", attempts: 0, hintLevel: 0, grantedRungs: [], hintsEverUsed: true });
    expect(actions).toContainEqual({ type: "CHANGE_EXPRESSION", expression: "encouraging" });
    expect(types(actions)).toContain("STEP_DONE");
    expect(types(actions)).not.toContain("COMPLETE");
    expect(says(actions).at(-1)?.messageKey).toBe("step.next");
    // a later correct answer still counts as helped
    const end = run([{ type: "ANSWER_SUBMITTED", correct: true }], state);
    expect(says(end.actions).at(-1)?.messageKey).toBe("correct.after-hints");
  });

  it("uses the content-supplied step reaction when present", () => {
    const c = { ...ctx, vars: { ...ctx.vars, dividend: 13 }, reactions: { stepNext: "Good. Now {dividend} ÷ 2." } };
    const { actions } = run([{ type: "STEP_COMPLETED" }], initialTutorState, c);
    expect(says(actions).at(-1)?.text).toBe("Good. Now 13 ÷ 2.");
  });
});

describe("message catalog integrity", () => {
  it("every nudgeKey used by content exists in the catalog", () => {
    for (const c of courses)
      for (const m of c.modules)
        for (const t of m.topics)
          for (const a of t.activities)
            for (const q of a.questions)
              for (const v of q.variants)
                for (const mis of v.misconceptions) expect(hasMessage(mis.nudgeKey), `${v.id}:${mis.nudgeKey}`).toBe(true);
  });

  it("every SAY produced across a full flow has no unfilled slots", () => {
    const flow: LearningEvent[] = [
      { type: "ACTIVITY_OPENED" }, { type: "HESITATION", seconds: 60 }, { type: "ANSWER_SUBMITTED", correct: false, misconceptionId: "ns.reversed" },
      { type: "ANSWER_SUBMITTED", correct: false }, { type: "ANSWER_SUBMITTED", correct: false, misconceptionId: "ns.extra-16" },
      { type: "HINT_REQUESTED" }, { type: "HINT_REQUESTED" }, { type: "HINT_REQUESTED" }, { type: "HINT_REQUESTED" }, { type: "HINT_REQUESTED" }, { type: "HINT_REQUESTED" }, { type: "HINT_REQUESTED" },
      { type: "EXPLAIN_SLOWLY_REQUESTED" }, { type: "EXPLANATION_STEP_DONE" }, { type: "PREDICTION_MADE", correct: false }, { type: "EXPLANATION_STEP_DONE" },
      { type: "EXPLANATION_STEP_DONE" }, { type: "EXPLANATION_STEP_DONE" }, { type: "EXPLANATION_STEP_DONE" }, { type: "EXPLANATION_STEP_DONE" },
      { type: "ANSWER_SUBMITTED", correct: true },
    ];
    const { actions } = run(flow);
    for (const s of says(actions)) {
      expect(s.text, s.messageKey).not.toMatch(/\{[a-zA-Z0-9_]+\}/);
      expect(s.text, s.messageKey).not.toMatch(/missing message/);
    }
  });

  it("kind-specific wrong.first message for timing.edge is reached and renders", () => {
    const timingCtx: ActivityContext = {
      ...ctx,
      kind: "timing",
      stepTag: "edge",
      vars: { ...ctx.vars },
    };
    const { actions } = run([{ type: "ANSWER_SUBMITTED", correct: false }], initialTutorState, timingCtx);
    const msg = says(actions).at(-1)!;
    expect(msg.messageKey).toBe("wrong.first.timing.edge");
    expect(msg.text).not.toMatch(/\{/);
  });

  it("kind-specific wrong.first message for state-diagram.next is reached and renders", () => {
    const sdCtx: ActivityContext = {
      ...ctx,
      kind: "state-diagram",
      stepTag: "next",
      vars: { ...ctx.vars },
    };
    const { actions } = run([{ type: "ANSWER_SUBMITTED", correct: false }], initialTutorState, sdCtx);
    const msg = says(actions).at(-1)!;
    expect(msg.messageKey).toBe("wrong.first.state-diagram.next");
    expect(msg.text).not.toMatch(/\{/);
  });

  it("kind-specific wrong.first message for state-diagram.label with output is reached and renders", () => {
    const sdCtx: ActivityContext = {
      ...ctx,
      kind: "state-diagram",
      stepTag: "label",
      vars: { ...ctx.vars, inputName: "x", outputName: "z" },
    };
    const { actions } = run([{ type: "ANSWER_SUBMITTED", correct: false }], initialTutorState, sdCtx);
    const msg = says(actions).at(-1)!;
    expect(msg.messageKey).toBe("wrong.first.state-diagram.label");
    expect(msg.text).toContain("/");
    expect(msg.text).not.toMatch(/\{/);
  });

  it("kind-specific wrong.first message for state-diagram.label without output is reached and renders", () => {
    const sdCtx: ActivityContext = {
      ...ctx,
      kind: "state-diagram",
      stepTag: "label",
      vars: { ...ctx.vars, inputName: "x" },
    };
    const { actions } = run([{ type: "ANSWER_SUBMITTED", correct: false }], initialTutorState, sdCtx);
    const msg = says(actions).at(-1)!;
    expect(msg.messageKey).toBe("wrong.first.state-diagram.label.no-output");
    expect(msg.text).not.toContain("/");
    expect(msg.text).not.toMatch(/\{/);
  });
});
