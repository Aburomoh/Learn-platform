import { describe, expect, it } from "vitest";
import { reduce } from "./reduce";
import { initialTutorState, canRequestScaffold, legacyWalkthroughLosesWork, type TutorState, type ActivityContext } from "./state";
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
    expect(actions).toContainEqual({ type: "CHANGE_EXPRESSION", expression: "concern" }); // try_again (#663)
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

  it("gate: no hint before the student engages (\"try once first\"); Explain Slowly is never gated (#690)", () => {
    const h = run([{ type: "HINT_REQUESTED" }]);
    expect(h.state.hintLevel).toBe(0);
    expect(types(h.actions)).not.toContain("REVEAL_HINT");
    expect(says(h.actions).at(-1)?.messageKey).toBe("hint.try-first-or-stuck");
    expect(canRequestScaffold(initialTutorState)).toBe(false);
    // instruction, not a hint: opens before any attempt, any engagement, any wait
    const e = run([{ type: "EXPLAIN_SLOWLY_REQUESTED" }]);
    expect(e.state.stage).toBe("explaining");
    expect(e.actions).toContainEqual({ type: "ADVANCE_EXPLANATION", step: 0 });
  });

  it("engagement: the first edit opens the hint gate, a completed step closes it again, the next edit reopens it (#690)", () => {
    const opened = run([{ type: "ENGAGED" }]);
    expect(opened.state.engaged).toBe(true);
    expect(canRequestScaffold(opened.state)).toBe(true);
    const hint = run([{ type: "HINT_REQUESTED" }], opened.state);
    expect(types(hint.actions)).toContain("REVEAL_HINT");
    expect(hint.state.grantedRungs).toEqual([2]);
    const next = run([{ type: "STEP_COMPLETED" }], hint.state);
    expect(next.state.engaged).toBe(false);
    expect(canRequestScaffold(next.state)).toBe(false);
    expect(says(run([{ type: "HINT_REQUESTED" }], next.state).actions).at(-1)?.messageKey).toBe("hint.try-first-or-stuck");
    expect(canRequestScaffold(run([{ type: "ENGAGED" }], next.state).state)).toBe(true);
  });

  it("idle: after 45 s a quiet line only, once per attempt cycle; it opens no hint (#690)", () => {
    const idle = run([{ type: "IDLE", seconds: 20 }, { type: "IDLE", seconds: 50 }, { type: "IDLE", seconds: 90 }]);
    expect(says(idle.actions).filter((s) => s.messageKey === "idle.quiet")).toHaveLength(1);
    expect(idle.actions).toContainEqual({ type: "CHANGE_EXPRESSION", expression: "reassuring" });
    expect(types(idle.actions)).not.toContain("REVEAL_HINT");
    expect(idle.state.engaged).toBe(false);
    expect(canRequestScaffold(idle.state)).toBe(false);
    expect(says(run([{ type: "HINT_REQUESTED" }], idle.state).actions).at(-1)?.messageKey).toBe("hint.try-first-or-stuck");
    // a new attempt starts a new cycle
    const again = run([{ type: "ANSWER_SUBMITTED", correct: false }, { type: "IDLE", seconds: 60 }], idle.state);
    expect(says(again.actions).filter((s) => s.messageKey === "idle.quiet")).toHaveLength(1);
  });

  it("\"I am stuck\": engages, grants the lowest rung not yet granted, then offers a hint or Explain Slowly (#690)", () => {
    const fresh = run([{ type: "STUCK_REQUESTED" }]);
    expect(fresh.state.engaged).toBe(true);
    expect(fresh.state.grantedRungs).toEqual([2]);
    expect(says(fresh.actions).map((s) => s.messageKey)).toEqual(["stuck.start", "hint.rung-2", "stuck.offer"]);
    expect(fresh.actions).toContainEqual({ type: "OFFER_HELP", options: ["hint", "explain-slowly"] });
    expect(types(fresh.actions)).not.toContain("REQUEST_RETRY"); // not a wrong answer
    expect(fresh.state.attempts).toBe(0); // and not a Check

    // two wrong checks granted rung 3; rung 2 was never given: the lowest is still 2, and the level stays 3
    const afterTwo = run([{ type: "ANSWER_SUBMITTED", correct: false }, { type: "ANSWER_SUBMITTED", correct: false }]);
    expect(afterTwo.state.grantedRungs).toEqual([3]);
    const stuck = run([{ type: "STUCK_REQUESTED" }], afterTwo.state);
    expect(stuck.state.grantedRungs).toEqual([3, 2]);
    expect(stuck.state.hintLevel).toBe(3);
    // a Hint request then continues above the highest rung granted
    expect(run([{ type: "HINT_REQUESTED" }], stuck.state).state.grantedRungs).toEqual([3, 2, 4]);
  });

  it("\"I am stuck\" with every rung granted offers Explain Slowly only", () => {
    const all = ctx.hints.map((h) => h.rung);
    const start: TutorState = { ...initialTutorState, engaged: true, grantedRungs: all, hintLevel: Math.max(...all) };
    const r = run([{ type: "STUCK_REQUESTED" }], start);
    expect(says(r.actions).map((s) => s.messageKey)).toContain("hints.exhausted");
    expect(r.actions).toContainEqual({ type: "OFFER_HELP", options: ["explain-slowly"] });
    expect(types(r.actions)).not.toContain("REVEAL_HINT");
  });

  it("reflex guard: a Hint or \"I am stuck\" tap within 5 s of the step appearing is ignored without a message (#690)", () => {
    const engaged: TutorState = { ...initialTutorState, engaged: true };
    for (const e of [{ type: "HINT_REQUESTED", sinceStepMs: 1200 }, { type: "STUCK_REQUESTED", sinceStepMs: 4999 }] as LearningEvent[]) {
      const r = run([e], engaged);
      expect(r.actions).toEqual([]);
      expect(r.state).toEqual(engaged);
    }
    expect(types(run([{ type: "HINT_REQUESTED", sinceStepMs: 5000 }], engaged).actions)).toContain("REVEAL_HINT");
    // Explain Slowly has no such guard
    expect(run([{ type: "EXPLAIN_SLOWLY_REQUESTED" }]).state.stage).toBe("explaining");
  });

  it("Explain Slowly: not on a finished question, and not twice while one is open", () => {
    const done = run([{ type: "ANSWER_SUBMITTED", correct: true }, { type: "EXPLAIN_SLOWLY_REQUESTED" }]);
    expect(done.state.stage).toBe("complete");
    expect(types(done.actions)).not.toContain("ADVANCE_EXPLANATION");
    const open = run([{ type: "EXPLAIN_SLOWLY_REQUESTED" }]);
    const second = reduce(open.state, { type: "EXPLAIN_SLOWLY_REQUESTED" }, ctx);
    expect(second.actions).toEqual([]);
    expect(second.state).toEqual(open.state);
  });

  it("interim: a legacy walkthrough past step 0 asks once before it restarts the question (#690, §2.6)", () => {
    const later: ActivityContext = { ...ctx, stepIndex: 2 };
    expect(legacyWalkthroughLosesWork(later)).toBe(true);
    expect(legacyWalkthroughLosesWork(ctx)).toBe(false);
    expect(legacyWalkthroughLosesWork({ stepIndex: 0 })).toBe(false);
    const ask = run([{ type: "EXPLAIN_SLOWLY_REQUESTED" }], initialTutorState, later);
    expect(ask.state.stage).toBe("await_answer");
    expect(ask.actions).toContainEqual({ type: "CONFIRM_RESTART" });
    expect(says(ask.actions).at(-1)?.messageKey).toBe("explain.confirm-restart");
    const go = run([{ type: "EXPLAIN_SLOWLY_REQUESTED", confirmed: true }], initialTutorState, later);
    expect(go.state.stage).toBe("explaining");
    expect(types(go.actions)).not.toContain("CONFIRM_RESTART");
  });

  it("the new tutor strings are in the catalog and carry no slot", () => {
    for (const key of ["hint.try-first-or-stuck", "idle.quiet", "stuck.start", "stuck.offer", "explain.confirm-restart"]) {
      expect(hasMessage(key), key).toBe(true);
    }
    for (const a of [run([{ type: "STUCK_REQUESTED" }]).actions, run([{ type: "IDLE", seconds: 60 }]).actions]) {
      for (const s of says(a)) expect(s.text, s.messageKey).not.toMatch(/\{/);
    }
  });

  it("legacy HESITATION (until the runner sends ENGAGED and IDLE, learn 1b): prompts once, then unlocks scaffolds", () => {
    const { state, actions } = run([
      { type: "HESITATION", seconds: 20 },
      { type: "HESITATION", seconds: 50 },
      { type: "HESITATION", seconds: 90 },
    ]);
    expect(says(actions).filter((s) => s.messageKey === "hesitation")).toHaveLength(1);
    expect(actions).toContainEqual({ type: "CHANGE_EXPRESSION", expression: "reassuring" }); // curious is retired (#663)
    expect(actions.some((a) => a.type === "CHANGE_EXPRESSION" && (a.expression as string) === "curious")).toBe(false);
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
    expect(r.actions).toContainEqual({ type: "CHANGE_EXPRESSION", expression: "aha" }); // the explanation clicks (#663)
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

  it("poses (#663): first wrong keeps try_again (concern); the second and later wrong answers reassure until the step moves on", () => {
    const one = run([{ type: "ANSWER_SUBMITTED", correct: false }]);
    expect(one.state.expression).toBe("concern");
    const two = run([{ type: "ANSWER_SUBMITTED", correct: false }], one.state);
    expect(two.state.expression).toBe("reassuring");
    expect(two.actions).toContainEqual({ type: "CHANGE_EXPRESSION", expression: "reassuring" });
    const three = run([{ type: "ANSWER_SUBMITTED", correct: false }], two.state);
    expect(three.state.expression).toBe("reassuring");
    // the step moves on: the next step's first wrong answer is try_again again
    const next = run([{ type: "STEP_COMPLETED" }, { type: "ANSWER_SUBMITTED", correct: false }], three.state);
    expect(next.state.expression).toBe("concern");
  });

  it("poses (#663): aha on a correct prediction, and on the first correct answer or step straight after Explain Slowly; not on a later one", () => {
    const steps = ctx.explanation.length;
    const explained = run([{ type: "ANSWER_SUBMITTED", correct: false }, { type: "EXPLAIN_SLOWLY_REQUESTED" }, ...Array.from({ length: steps }, () => ({ type: "EXPLANATION_STEP_DONE" }) as LearningEvent)]);
    expect(explained.state.afterExplanation).toBe(true);
    expect(explained.state.stage).not.toBe("explaining");
    const aha = run([{ type: "RETRY_REQUESTED", newVariant: true }, { type: "ANSWER_SUBMITTED", correct: true }], explained.state);
    expect(aha.actions).toContainEqual({ type: "CHANGE_EXPRESSION", expression: "aha" });
    expect(aha.state.expression).toBe("aha");
    // a wrong answer first: the later correct one is the usual pleased
    const later = run([{ type: "ANSWER_SUBMITTED", correct: false }, { type: "ANSWER_SUBMITTED", correct: true }], explained.state);
    expect(later.state.expression).toBe("pleased");
    expect(later.actions.filter((a) => a.type === "CHANGE_EXPRESSION").map((a) => (a as { expression: string }).expression)).not.toContain("aha");
    // a correct step straight after the explanation
    const step = run([{ type: "STEP_COMPLETED" }], explained.state);
    expect(step.state.expression).toBe("aha");
    expect(step.state.afterExplanation).toBe(false);
    // without an explanation a correct answer is pleased
    expect(run([{ type: "ANSWER_SUBMITTED", correct: true }]).state.expression).toBe("pleased");
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

describe("a diagnosed mistake counts as help already given (#700)", () => {
  const dctx: ActivityContext = {
    ...ctx,
    hints: [
      { rung: 2, text: "Not yet. Do it once more." },
      { rung: 3, text: "Each step: divide by 2." },
      { rung: 4, text: "Is it even or odd?" },
    ],
    misconceptionKeys: { swapped: "div.swapped" },
    vars: { ...ctx.vars },
  };
  const wrong: LearningEvent = { type: "ANSWER_SUBMITTED", correct: false, misconceptionId: "swapped" };
  const hintRungs = (actions: TutorAction[]) => actions.flatMap((a) => (a.type === "REVEAL_HINT" ? [a.rung] : []));

  it("the first Hint after a diagnosis is not the generic nudge", () => {
    const r = run([wrong, { type: "HINT_REQUESTED" }], initialTutorState, dctx);
    expect(hintRungs(r.actions)).toEqual([3]);
  });

  it("the diagnosis is recorded and re-sent with the hint, so it stays visible", () => {
    const r = run([wrong, { type: "HINT_REQUESTED" }], initialTutorState, dctx);
    expect(r.state.diagnosis?.messageKey).toBe("div.swapped");
    expect(r.actions.filter((a) => a.type === "DIAGNOSIS")).toHaveLength(2);
  });

  it("\"I am stuck\" after a diagnosis also starts above the generic nudge", () => {
    const r = run([wrong, { type: "STUCK_REQUESTED" }], initialTutorState, dctx);
    expect(hintRungs(r.actions)).toEqual([3]);
  });

  it("without a diagnosis the ladder starts at the generic nudge as before", () => {
    const r = run([{ type: "ANSWER_SUBMITTED", correct: false }, { type: "HINT_REQUESTED" }], initialTutorState, dctx);
    expect(hintRungs(r.actions)).toEqual([2]);
  });

  it("the diagnosis is cleared when the step completes", () => {
    const r = run([wrong, { type: "STEP_COMPLETED" }], initialTutorState, dctx);
    expect(r.state.diagnosis).toBeUndefined();
  });

  it("a ladder with nothing above the nudge still gives the nudge, never 'hints exhausted'", () => {
    const only: ActivityContext = { ...dctx, hints: [{ rung: 2, text: "Not yet." }] };
    const r = run([wrong, { type: "HINT_REQUESTED" }], initialTutorState, only);
    expect(hintRungs(r.actions)).toEqual([2]);
  });
});
