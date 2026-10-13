/**
 * Rule-based tutor engine (ADR-0003). Pure: (state, event, ctx) → { state, actions }.
 * Rules are documented in docs/TUTOR_ENGINE.md. The engine never decides correctness; the
 * stage grades against content and passes the result in the event.
 */
import { fill } from "@/content/template";
import type { LearningEvent } from "./events";
import type { Expression, TutorAction } from "./actions";
import { canRequestScaffold, IDLE_SECONDS, initialTutorState, legacyWalkthroughLosesWork, lowestUngrantedHint, nextHint, REFLEX_GUARD_MS, type ActivityContext, type TutorState } from "./state";
import { hasMessage, messageTemplate, resolveMessage } from "../messages";
import { softenNudge } from "./soften";

export interface ReduceResult {
  state: TutorState;
  actions: TutorAction[];
}

export function reduce(state: TutorState, event: LearningEvent, ctx: ActivityContext): ReduceResult {
  const out: TutorAction[] = [];
  const say = (key: string, extra: Record<string, string | number> = {}) => {
    const vars = { ...ctx.vars, ...extra };
    out.push({ type: "SAY", messageKey: key, text: resolveMessage(key, vars, ctx.locale), template: messageTemplate(key), vars });
  };
  const sayText = (key: string, text: string) => out.push({ type: "SAY", messageKey: key, text: fill(text, ctx.vars), template: text, vars: ctx.vars });
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
      s.idlePrompted = false;
      const justExplained = s.afterExplanation;
      s.afterExplanation = false;
      if (event.correct) {
        s.stage = "complete";
        // the explanation clicked (#663): the first correct answer straight after Explain Slowly
        s.expression = justExplained ? "aha" : "pleased";
        express(s.expression);
        const usedHints = s.hintLevel > 0 || s.hintsEverUsed;
        const override = usedHints ? ctx.reactions?.correctAfterHints : ctx.reactions?.correct;
        if (override) sayText(usedHints ? "correct.after-hints" : "correct", override);
        else say(usedHints ? "correct.after-hints" : "correct");
        out.push({ type: "COMPLETE" });
        break;
      }
      s.stage = "await_retry";
      s.lastMisconception = event.misconceptionId;
      // a diagnosis describes the latest answer only (#703): replaced below when this one names a mistake, otherwise gone
      s.diagnosis = undefined;
      if (s.attempts === 1) {
        // Rule 1: nudge only, never reveal. Misconception-specific when recognised. The first wrong answer keeps try_again (#663).
        s.expression = "concern";
        express("concern");
        const key = event.misconceptionId && misconceptionKey(ctx, event.misconceptionId);
        if (key) {
          say(key, event.vars);
          diagnose(s, out);
        } else say(genericWrongKey(ctx, event, "wrong.first"), event.vars);
        out.push({ type: "REQUEST_RETRY" });
        break;
      }
      if (s.attempts === 2) {
        // Rule 2: concept reminder (rung ≤ 3) plus focus on the content-declared target. Reassuring from the second wrong answer on (#663).
        s.expression = "reassuring";
        express("reassuring");
        say("wrong.second");
        // rule 2 does not speak the misconception line, but the mistake is still named for the ladder and the view
        const named = event.misconceptionId && misconceptionKey(ctx, event.misconceptionId);
        if (named) {
          const vars = { ...ctx.vars, ...event.vars };
          s.diagnosis = { messageKey: named, text: resolveMessage(named, vars, ctx.locale), template: messageTemplate(named), vars };
        }
        const reminder = ctx.hints.find((h) => h.rung === 3) ?? nextHint(s, ctx);
        if (reminder && reminder.rung > s.hintLevel) grant(s, reminder.rung, out, reminder.text, ctx);
        const focus = ctx.hints.find((h) => h.focus)?.focus;
        if (focus) out.push({ type: "FOCUS", target: fill(focus, ctx.vars) });
        out.push({ type: "REQUEST_RETRY" });
        break;
      }
      // Rule 3 (attempts ≥ 3): progressive support, one rung per wrong answer; still reassuring (#663).
      s.expression = "reassuring";
      express("reassuring");
      const key = event.misconceptionId && misconceptionKey(ctx, event.misconceptionId);
      if (key) {
        say(key, event.vars);
        diagnose(s, out);
      } else say(genericWrongKey(ctx, event, "wrong.again"), event.vars);
      const h = nextHint(s, ctx);
      if (h) {
        grant(s, h.rung, out, h.text, ctx);
        pointAt(h, out, ctx);
      }
      out.push({ type: "REQUEST_RETRY" });
      break;
    }

    case "STEP_COMPLETED": {
      if (s.stage === "complete" || s.stage === "explaining") break;
      // The ladder restarts for the next step; remember that help was used on this variant.
      // A correct step straight after Explain Slowly is the explanation clicking (#663): aha, then encouraging as usual.
      const clicked = s.afterExplanation;
      s = { ...s, stage: "await_answer", attempts: 0, engaged: false, idlePrompted: false, afterExplanation: false, hintsEverUsed: s.hintsEverUsed || s.hintLevel > 0, hintLevel: 0, grantedRungs: [], lastMisconception: undefined, diagnosis: undefined, expression: clicked ? "aha" : "encouraging" };
      express(s.expression);
      if (ctx.reactions?.stepNext) sayText("step.next", ctx.reactions.stepNext);
      else say(stepNextKey(ctx));
      out.push({ type: "STEP_DONE" });
      break;
    }

    case "HINT_REQUESTED": {
      if (reflex(event.sinceStepMs)) break;
      if (!canRequestScaffold(s)) {
        // "Try once first" stays (#690, H1), with the way out: say you are stuck.
        if (s.stage === "await_answer") say("hint.try-first-or-stuck");
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
      grant(s, h.rung, out, h.text, ctx);
      pointAt(h, out, ctx);
      break;
    }

    case "ENGAGED": {
      if (s.stage === "complete" || s.stage === "explaining") break;
      s.engaged = true;
      break;
    }

    case "STUCK_REQUESTED": {
      if (reflex(event.sinceStepMs)) break;
      if (s.stage === "complete" || s.stage === "explaining") break;
      s.engaged = true;
      // The lowest rung not yet granted, never skipping one; it is recorded like any hint (S2, S3).
      const h = lowestUngrantedHint(s, ctx);
      say("stuck.start");
      if (h) {
        s.expression = h.rung >= 6 ? "explaining" : h.rung === 4 ? "thinking" : "neutral";
        express(s.expression);
        grant(s, h.rung, out, h.text, ctx);
        pointAt(h, out, ctx);
      } else {
        s.expression = "encouraging";
        express("encouraging");
        say("hints.exhausted");
      }
      say("stuck.offer");
      out.push({ type: "OFFER_HELP", options: h ? ["hint", "explain-slowly"] : ["explain-slowly"] });
      break;
    }

    case "EXPLAIN_SLOWLY_REQUESTED": {
      // Instruction, not a hint: never gated by attempts, engagement or time (#690, E1). Only a
      // finished question or a walkthrough already open ignores it.
      if (s.stage === "complete" || s.stage === "explaining") break;
      if (legacyWalkthroughLosesWork(ctx) && !event.confirmed) {
        say("explain.confirm-restart");
        out.push({ type: "CONFIRM_RESTART" });
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
      // a correct prediction is the explanation clicking (#663)
      s.expression = event.correct ? "aha" : "neutral";
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
          s = { ...initialTutorState, hintsEverUsed: true, afterExplanation: true, expression: "encouraging" };
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
        s.afterExplanation = true;
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
        // a fresh variant, but an explanation that just ended still counts for the aha (#663)
        s = { ...initialTutorState, afterExplanation: s.afterExplanation, expression: "encouraging" };
        express("encouraging");
        say("retry.variant");
      } else {
        s = { ...s, stage: "await_answer", explanationStep: 0, idlePrompted: false, diagnosis: undefined };
        say("retry.same");
      }
      out.push({ type: "RESET_INTERACTION" });
      break;
    }

    case "IDLE": {
      // A quiet line only: idle never opens a hint (#690, H2). Every input resets the runner's clock.
      if (s.stage === "complete" || s.stage === "explaining" || s.idlePrompted) break;
      if (event.seconds < IDLE_SECONDS) break;
      s.idlePrompted = true;
      // curious is retired (#663): idle reassures
      s.expression = "reassuring";
      express("reassuring");
      say("idle.quiet");
      break;
    }

    case "HESITATION": {
      // Legacy (see the event's note): the quiet line, and the old gate-opening until the runner sends ENGAGED.
      if (s.stage === "complete" || s.stage === "explaining" || s.idlePrompted) break;
      if (event.seconds < IDLE_SECONDS) break;
      s.idlePrompted = true;
      s.engaged = true;
      s.expression = "reassuring";
      express("reassuring");
      say("hesitation");
      break;
    }
  }

  return { state: s, actions: out };
}

/** The generic wrong line: a grid answer with wrong cells says `wrong.cell` (points at the marked
 * cell), anything else the plain fallback. Either may have a step form `<key>.<stepTag>`, and a
 * kind-specific one `<key>.<kind>.<stepTag>` first (tags such as "group" mean different things in
 * different kinds). Special: state-diagram labels may have variant forms with/without output.
 */
function genericWrongKey(ctx: ActivityContext, event: { vars?: Record<string, string | number> }, fallback: string): string {
  const key = event.vars?.wrongCount === undefined ? fallback : "wrong.cell";
  if (!ctx.stepTag) return key;
  const forms: string[] = [];
  if (ctx.kind === "state-diagram" && ctx.stepTag === "label" && !ctx.vars.outputName) {
    forms.push(`${key}.${ctx.kind}.${ctx.stepTag}.no-output`);
  }
  forms.push(`${key}.${ctx.kind}.${ctx.stepTag}`, `${key}.${ctx.stepTag}`);
  for (const form of forms) if (hasMessage(form)) return form;
  return key;
}

/** The line after a correct step names the next goal (ctx is for the new step). */
function stepNextKey(ctx: ActivityContext): string {
  const { gateName, stepNumber, gateCount, carryIn, columnLabel, columnCount } = ctx.vars;
  if (columnLabel !== undefined) return stepNumber !== undefined && stepNumber === columnCount ? "step.last-table-column" : "step.next-table-column";
  if (ctx.stepTag === "column") return carryIn === 1 ? "step.next-column-carry" : "step.next-column";
  if (ctx.vars.groupNumber !== undefined && ctx.stepTag === "group") return ctx.vars.groupNumber === 1 ? "step.next-kmap-group" : "step.next-kmap-group-more";
  if (ctx.vars.groupNumber !== undefined && ctx.stepTag === "term") return "step.next-kmap-term";
  if (ctx.vars.groupNumber !== undefined && ctx.stepTag === "answer") return "step.next-kmap-answer";
  if (ctx.stepTag === "edge") return `step.next-${ctx.kind}.edge`;
  if (ctx.stepTag === "next") return `step.next-${ctx.kind}.next`;
  if (ctx.stepTag === "label") return `step.next-${ctx.kind}.label`;
  if (ctx.stepTag === "law") return "step.next-law";
  if (ctx.stepTag === "line") return "step.next-line";
  if (ctx.stepTag === "digit") return "step.next-digit";
  if (ctx.stepTag === "bits") return "step.next-bits";
  if (ctx.stepTag === "carry") return "step.last-carry";
  if (ctx.stepTag === "terms") return "step.next-terms";
  if (ctx.stepTag === "sum") return "step.next-sum";
  if (ctx.stepTag !== "gate" && gateName === undefined) return "step.next";
  return stepNumber !== undefined && stepNumber === gateCount ? "step.last-gate" : "step.next-gate";
}

/** Content nudge key, or its step-specific form `<key>.<stepTag>` when the catalog has one. */
function misconceptionKey(ctx: ActivityContext, id: string): string | undefined {
  const key = ctx.misconceptionKeys?.[id];
  if (key && ctx.stepTag && hasMessage(`${key}.${ctx.stepTag}`)) return `${key}.${ctx.stepTag}`;
  return key;
}

/** A step that appeared a moment ago ignores a Hint or "I am stuck" tap: a reflex double tap, not a request. */
function reflex(sinceStepMs: number | undefined): boolean {
  return sinceStepMs !== undefined && sinceStepMs < REFLEX_GUARD_MS;
}

/** Remember the named misconception so help builds on it (#700) and tell the view it stands on the step. */
function diagnose(s: TutorState, out: TutorAction[]) {
  const said = out[out.length - 1];
  if (said?.type !== "SAY") return;
  s.diagnosis = { messageKey: said.messageKey, text: said.text, template: said.template, vars: said.vars };
  out.push({ type: "DIAGNOSIS", ...s.diagnosis });
}

function grant(s: TutorState, rung: number, out: TutorAction[], template: string, ctx: ActivityContext) {
  // "I am stuck" can grant a lower rung after a higher one (a wrong check granted 3): the level stays the highest granted
  s.hintLevel = Math.max(s.hintLevel, rung);
  s.grantedRungs = [...s.grantedRungs, rung];
  // before any Check there is no answer to call "not yet" (#717): the nudge is shown without its verdict
  const unchecked = s.attempts === 0;
  const text = fill(unchecked ? softenNudge(template) : template, ctx.vars);
  out.push({ type: "REVEAL_HINT", rung, text, template, vars: ctx.vars, ...(unchecked ? { unchecked } : {}) });
  out.push({ type: "SAY", messageKey: `hint.rung-${rung}`, text, template, vars: ctx.vars, ...(unchecked ? { unchecked } : {}) });
  // the diagnosis stays on the step (#700): the view keeps it as the first card, the hint is the next one
  if (s.diagnosis) out.push({ type: "DIAGNOSIS", ...s.diagnosis });
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
  out.push({ type: "SAY", messageKey: `explain.step-${step.id}`, text: fill(step.say, ctx.vars), template: step.say, vars: ctx.vars });
  if (step.ask) out.push({ type: "ASK", stepId: step.id });
}
