/**
 * Rule-based tutor engine (ADR-0003). Pure: (state, event, ctx) → { state, actions }.
 * Rules are documented in docs/TUTOR_ENGINE.md. The engine never decides correctness; the
 * stage grades against content and passes the result in the event.
 */
import { fill } from "@/content/template";
import type { LearningEvent } from "./events";
import type { Expression, TutorAction } from "./actions";
import { canRequestScaffold, HESITATION_SECONDS, initialTutorState, nextHint, type ActivityContext, type TutorState } from "./state";
import { resolveMessage } from "../messages";

export interface ReduceResult {
  state: TutorState;
  actions: TutorAction[];
}

export function reduce(state: TutorState, event: LearningEvent, ctx: ActivityContext): ReduceResult {
  const out: TutorAction[] = [];
  const say = (key: string, extra: Record<string, string | number> = {}) =>
    out.push({ type: "SAY", messageKey: key, text: resolveMessage(key, { ...ctx.vars, ...extra }, ctx.locale) });
  const sayText = (key: string, text: string) => out.push({ type: "SAY", messageKey: key, text: fill(text, ctx.vars) });
  const express = (expression: Expression) => out.push({ type: "CHANGE_EXPRESSION", expression });
  let s: TutorState = { ...state };

  switch (event.type) {
    case "ACTIVITY_OPENED": {
      s = { ...initialTutorState };
      express("neutral");
      say("open");
      break;
    }

    case "ANSWER_SUBMITTED": {
      if (s.stage === "complete" || s.stage === "explaining") break;
      s.attempts += 1;
      s.hesitationPrompted = false;
      if (event.correct) {
        s.stage = "complete";
        s.expression = "pleased";
        express("pleased");
        const usedHints = s.hintLevel > 0 || s.hintsEverUsed;
        const override = usedHints ? ctx.reactions?.correctAfterHints : ctx.reactions?.correct;
        if (override) sayText(usedHints ? "correct.after-hints" : "correct", override);
        else say(usedHints ? "correct.after-hints" : "correct");
        out.push({ type: "COMPLETE" });
        break;
      }
      s.stage = "await_retry";
      s.lastMisconception = event.misconceptionId;
      if (s.attempts === 1) {
        // Rule 1: nudge only, never reveal. Misconception-specific when recognised.
        s.expression = "thinking";
        express("thinking");
        if (event.misconceptionId) {
          const key = misconceptionKey(ctx, event.misconceptionId);
          if (key) say(key);
          else say("wrong.first");
        } else say("wrong.first");
        out.push({ type: "REQUEST_RETRY" });
        break;
      }
      if (s.attempts === 2) {
        // Rule 2: concept reminder (rung ≤ 3) plus focus on the content-declared target.
        s.expression = "thinking";
        express("thinking");
        say("wrong.second");
        const reminder = ctx.hints.find((h) => h.rung === 3) ?? nextHint(s, ctx);
        if (reminder && reminder.rung > s.hintLevel) grant(s, reminder.rung, out, fill(reminder.text, ctx.vars));
        const focus = ctx.hints.find((h) => h.focus)?.focus;
        if (focus) out.push({ type: "FOCUS", target: fill(focus, ctx.vars) });
        out.push({ type: "REQUEST_RETRY" });
        break;
      }
      // Rule 3 (attempts ≥ 3): progressive support, one rung per wrong answer.
      s.expression = "concern";
      express("concern");
      if (event.misconceptionId) {
        const key = misconceptionKey(ctx, event.misconceptionId);
        if (key) say(key);
        else say("wrong.again");
      } else say("wrong.again");
      const h = nextHint(s, ctx);
      if (h) {
        grant(s, h.rung, out, fill(h.text, ctx.vars));
        pointAt(h, out, ctx);
      }
      out.push({ type: "REQUEST_RETRY" });
      break;
    }

    case "STEP_COMPLETED": {
      if (s.stage === "complete" || s.stage === "explaining") break;
      // The ladder restarts for the next step; remember that help was used on this variant.
      s = { ...s, stage: "await_answer", attempts: 0, hesitationPrompted: false, hintsEverUsed: s.hintsEverUsed || s.hintLevel > 0, hintLevel: 0, grantedRungs: [], lastMisconception: undefined, expression: "encouraging" };
      express("encouraging");
      if (ctx.reactions?.stepNext) sayText("step.next", ctx.reactions.stepNext);
      else say(stepNextKey(ctx));
      out.push({ type: "STEP_DONE" });
      break;
    }

    case "HINT_REQUESTED": {
      if (!canRequestScaffold(s)) {
        if (s.stage === "await_answer") say("hint.try-first");
        break;
      }
      const h = nextHint(s, ctx);
      if (!h) {
        s.expression = "encouraging";
        express("encouraging");
        say("hints.exhausted");
        break;
      }
      s.expression = h.rung >= 6 ? "explaining" : h.rung === 4 ? "thinking" : "neutral";
      express(s.expression);
      grant(s, h.rung, out, fill(h.text, ctx.vars));
      pointAt(h, out, ctx);
      break;
    }

    case "EXPLAIN_SLOWLY_REQUESTED": {
      if (!canRequestScaffold(s)) {
        if (s.stage === "await_answer") say("hint.try-first");
        break;
      }
      s.stage = "explaining";
      s.explanationStep = 0;
      s.expression = "explaining";
      express("explaining");
      say("explain.start");
      advance(s, ctx, out);
      break;
    }

    case "PREDICTION_MADE": {
      if (s.stage !== "explaining") break;
      const step = ctx.explanation[s.explanationStep];
      if (!step?.ask) break;
      const text = event.correct ? step.ask.afterCorrect : step.ask.afterWrong;
      s.expression = event.correct ? "pleased" : "neutral";
      express(s.expression);
      if (text) sayText(event.correct ? "prediction.correct" : "prediction.wrong", text);
      else say(event.correct ? "prediction.correct" : "prediction.wrong");
      break;
    }

    case "EXPLANATION_STEP_DONE": {
      if (s.stage !== "explaining") break;
      if (s.explanationStep >= ctx.explanation.length - 1) {
        if (ctx.hasOtherVariant) {
          // Explanation finished: the explained numbers are now known, so the independent
          // attempt uses another variant (PEDAGOGY.md: never reveal, then accept). Help is remembered.
          s = { ...initialTutorState, hintsEverUsed: true, expression: "encouraging" };
          express("encouraging");
          say("explain.done-variant");
          out.push({ type: "SWITCH_VARIANT" });
          out.push({ type: "RESET_INTERACTION" });
          out.push({ type: "REQUEST_RETRY" });
          break;
        }
        // Explanation finished: hand control back for an independent attempt.
        s.stage = "await_retry";
        s.explanationStep = 0;
        s.expression = "encouraging";
        express("encouraging");
        say("explain.done");
        out.push({ type: "RESET_INTERACTION" });
        out.push({ type: "REQUEST_RETRY" });
        break;
      }
      s.explanationStep += 1;
      s.expression = "explaining";
      express("explaining");
      advance(s, ctx, out);
      break;
    }

    case "RETRY_REQUESTED": {
      if (event.newVariant) {
        s = { ...initialTutorState, expression: "encouraging" };
        express("encouraging");
        say("retry.variant");
      } else {
        s = { ...s, stage: "await_answer", explanationStep: 0, hesitationPrompted: false };
        say("retry.same");
      }
      out.push({ type: "RESET_INTERACTION" });
      break;
    }

    case "HESITATION": {
      if (s.stage === "complete" || s.stage === "explaining" || s.hesitationPrompted) break;
      if (event.seconds < HESITATION_SECONDS) break;
      s.hesitationPrompted = true;
      s.expression = "curious";
      express("curious");
      say("hesitation");
      break;
    }
  }

  return { state: s, actions: out };
}

/** Circuit walks name the next gate, and say when it is the last one (vars are for the new step). */
function stepNextKey(ctx: ActivityContext): string {
  const { gateName, stepNumber, gateCount } = ctx.vars;
  if (gateName === undefined) return "step.next";
  return stepNumber !== undefined && stepNumber === gateCount ? "step.last-gate" : "step.next-gate";
}

function misconceptionKey(ctx: ActivityContext, id: string): string | undefined {
  return ctx.misconceptionKeys?.[id];
}

function grant(s: TutorState, rung: number, out: TutorAction[], text: string) {
  s.hintLevel = rung;
  s.grantedRungs = [...s.grantedRungs, rung];
  out.push({ type: "REVEAL_HINT", rung, text });
  out.push({ type: "SAY", messageKey: `hint.rung-${rung}`, text });
}

/** Pointer targets may name the current step's element, e.g. "gate-{gateId}"; filled here. */
function pointAt(h: { focus?: string; highlight?: string; rung: number }, out: TutorAction[], ctx: ActivityContext) {
  if (h.focus) out.push({ type: "FOCUS", target: fill(h.focus, ctx.vars) });
  if (h.highlight) {
    const target = fill(h.highlight, ctx.vars);
    out.push({ type: "HIGHLIGHT", target });
    if (h.rung >= 5) out.push({ type: "PULSE", target });
  }
}

function advance(s: TutorState, ctx: ActivityContext, out: TutorAction[]) {
  const step = ctx.explanation[s.explanationStep];
  if (!step) return;
  out.push({ type: "ADVANCE_EXPLANATION", step: s.explanationStep });
  out.push({ type: "SAY", messageKey: `explain.step-${step.id}`, text: fill(step.say, ctx.vars) });
  if (step.ask) out.push({ type: "ASK", stepId: step.id });
}
