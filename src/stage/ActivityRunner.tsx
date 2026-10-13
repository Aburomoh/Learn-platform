"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { Activity, Course, Topic } from "@/content/schema";
import { product } from "../../config/product";
import { HintReveal } from "@/interactions/HintReveal/HintReveal";
import { resolveMessage } from "@/tutor";
import { engagePolicy } from "@/kinds";
import { TutorPanel, TutorPosePreload, useFocusEffects } from "@/tutor/ui";
import { effectiveDone, effectiveStatus } from "@/learner/progress";
import { useOfferingProgress, usePrefs, getProgressStore, recordAttempt, completeActivity, completeQuestion, markExplained, skipQuestion, skippedAhead, flushPendingWrites } from "@/learner";
import { createRunnerReducer, initialRunnerState, resumeRunnerState, currentVariant, hasAnotherVariant, questionViewKey, type RunnerState } from "./runnerReducer";
import { QuestionView } from "./QuestionView";
import { ActivitySummary } from "./ActivitySummary";
import { KindPrefetch } from "@/kinds/ui";
import { useHydrated } from "@/shell/useHydrated";
import { RESUME_ATTR } from "./resumeMarker";
import { ChallengeSteps, type ChallengeStep } from "@/shell/r1/ChallengeSteps";
import { practiceHref, skipOffer, topicAction } from "@/shell/primaryAction";
import { SkipMenu } from "./SkipMenu";
import { StageControls } from "./StageControls";
import styles from "./Stage.module.css";

export interface ActivityRunnerProps {
  course: Course;
  topic: Topic;
  activity: Activity;
}

/** The idle clock is sampled this often; the engine speaks once at 45 s (#691, H2). */
const IDLE_TICK_MS = 15_000;


/** Review links carry `?review=1`: restart at challenge 1 instead of resuming. */
function isReview(): boolean {
  return new URLSearchParams(window.location.search).has("review");
}

/** Where this visit starts: Continue resumes, Review or a finished practice starts at challenge 1. */
function startState(offeringId: string, activity: Activity): RunnerState {
  const record = getProgressStore(offeringId).get().activities[activity.id];
  if (isReview() || !record || effectiveStatus(activity, record) === "completed") return initialRunnerState(activity);
  return resumeRunnerState(activity, [...effectiveDone(activity, record).completed]);
}

/**
 * Learning Stage entry. The page is pre-rendered with challenge 1, so a new student sees the
 * question at first paint and hydration simply attaches to it. Local progress is only readable in
 * the browser: when it says the student is part-way through, the runner is remounted on the
 * resume challenge right after hydration. For that case the page's inline marker script has
 * already hidden the pre-rendered stage (see resumeMarker.ts), so challenge 1 never flashes.
 */
export function ActivityRunner(props: ActivityRunnerProps) {
  const { course, activity } = props;
  // false while rendering on the server and during hydration, true on any later (client) render
  const client = useHydrated();
  const start = useMemo(() => (client ? startState(course.offeringId, activity) : initialRunnerState(activity)), [client, course.offeringId, activity]);
  const resumed = start.qIndex > 0 || start.completed.some(Boolean);

  // Once the browser is idle, download the views of every kind this practice uses, so moving to
  // a challenge of another kind does not wait on the network (ADR-0008).
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(() => setIdle(true));
      return () => window.cancelIdleCallback(handle);
    }
    const timer = window.setTimeout(() => setIdle(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);
  const kindsUsed = useMemo(() => activity.questions.flatMap((q) => q.variants.map((v) => v.spec.kind)), [activity]);

  // Once the runner shows the right challenge, the pre-paint marker has done its job.
  useEffect(() => {
    if (client) document.documentElement.removeAttribute(RESUME_ATTR);
  }, [client]);

  return (
    <div className={styles.runner}>
      <Runner key={resumed ? "resumed" : "first"} {...props} initial={start} />
      {idle && <KindPrefetch kinds={kindsUsed} />}
      <TutorPosePreload portrait={product.brand.tutorPortrait} />
    </div>
  );
}

/**
 * Learning Stage (layer B). Owns runner state, feeds events to the tutor engine, applies
 * structured actions to the UI, and records compact evidence in the local learner store.
 * Everything here runs in the browser; there are no network calls.
 */
function Runner({ course, topic, activity, initial }: ActivityRunnerProps & { initial: RunnerState }) {
  const offeringId = course.offeringId;
  const reducer = useMemo(() => createRunnerReducer(activity), [activity]);
  const [state, dispatch] = useReducer(reducer, initial);
  const [progress, updateProgress] = useOfferingProgress(offeringId);
  const [prefs] = usePrefs();
  const stageRef = useRef<HTMLDivElement>(null);
  const { apply } = useFocusEffects(stageRef);

  const question = activity.questions[state.qIndex];
  const variant = currentVariant(activity, state);

  // Open once: tutor greeting. Nothing is written to progress on mount (ADR-0013): a look at a
  // practice is not study; the first attempt or finished challenge creates the record.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    dispatch({ type: "OPEN" });
  }, []);

  // Apply DOM effects after render, once per effect batch.
  const appliedSeq = useRef(0);
  useEffect(() => {
    if (state.effectSeq === appliedSeq.current) return;
    appliedSeq.current = state.effectSeq;
    for (const e of state.effects) apply(e);
  }, [state.effectSeq, state.effects, apply]);

  // Record evidence once per submitted attempt (batched by the store).
  const recordedSeq = useRef(0);
  useEffect(() => {
    if (state.attemptSeq === recordedSeq.current || !state.last) return;
    recordedSeq.current = state.attemptSeq;
    const { result } = state.last;
    const hintsUsed = state.tutor.hintLevel;
    updateProgress((p) =>
      recordAttempt(p, { activityId: activity.id, questionId: question.id, conceptId: question.conceptId, correct: result.correct, hintsUsed, misconceptionId: result.misconceptionId }),
    );
  }, [state.attemptSeq, state.last, state.tutor.hintLevel, activity.id, question.id, question.conceptId, updateProgress]);

  // Record each newly finished challenge so Continue can resume at the first unfinished one (#117).
  const recordedQuestions = useRef(new Set<number>(initial.completed.flatMap((done, i) => (done ? [i] : []))));
  useEffect(() => {
    state.completed.forEach((done, i) => {
      if (!done || recordedQuestions.current.has(i)) return;
      recordedQuestions.current.add(i);
      updateProgress((p) => completeQuestion(p, activity.id, activity.questions[i].id));
    });
  }, [state.completed, activity, updateProgress]);

  // Mark the activity complete once.
  const completedOnce = useRef(false);
  useEffect(() => {
    if (!state.done || completedOnce.current) return;
    completedOnce.current = true;
    updateProgress((p) => completeActivity(p, activity.id, state.hintsUsedTotal === 0));
  }, [state.done, state.hintsUsedTotal, activity.id, updateProgress]);

  // Idle (#691, H2): time since the last interaction, sampled every 15 s; the engine says one quiet
  // line at 45 s and opens nothing. Every input resets the clock (below).
  const lastInteraction = useRef(0);
  const touch = useCallback(() => {
    lastInteraction.current = Date.now();
  }, []);
  useEffect(() => {
    if (state.tutor.stage === "complete" || state.tutor.stage === "explaining" || state.done) return;
    lastInteraction.current = Date.now();
    const t = window.setInterval(() => {
      dispatch({ type: "IDLE", seconds: Math.round((Date.now() - lastInteraction.current) / 1000) });
    }, IDLE_TICK_MS);
    return () => window.clearInterval(t);
  }, [state.tutor.stage, state.done, state.qIndex, state.interactionKey]);

  // When the current step appeared (#691, H5): a Hint or "I'm stuck" tap in its first 5 s is a
  // reflex, ignored by the engine. Only before the first Check: a wrong Check is a deliberate student.
  const stepShownAt = useRef(0);
  useEffect(() => {
    stepShownAt.current = Date.now();
  }, [state.qIndex, state.stepIndex, state.interactionKey]);
  const sinceStep = () => (state.tutor.attempts === 0 ? Date.now() - stepShownAt.current : undefined);

  // Engagement (#691, §2.1): on a field or cell kind the first edit of the step engages it (hints
  // open without a Check); on a single-pick kind only a Check does. The stage listens for any
  // `input` / `change` so no kind has to report its edits; `onInput` (ADR-0008 amendment 1) is the
  // same signal with the exact target. Every edit also resets the idle clock. Bubble phase, never
  // capture: a state change before the field's own handler runs makes React restore the controlled
  // value first, and the first edit would read as empty.
  const onEdit = useCallback(() => {
    touch();
    if (engagePolicy(variant.spec.kind) === "input") dispatch({ type: "ENGAGED" });
  }, [touch, variant.spec.kind]);

  const act = useCallback(
    (a: Parameters<typeof dispatch>[0]) => {
      touch();
      dispatch(a);
    },
    [touch],
  );

  const stage = state.tutor.stage;
  const activityProgress = progress.activities[activity.id];

  // Explain Slowly opened: remembered on the practice record (#579); it no longer gates anything since #661.
  useEffect(() => {
    if (stage === "explaining") updateProgress((p) => markExplained(p, activity.id));
  }, [stage, activity.id, updateProgress]);

  // The quiet skip (#579, #623, #661): on every question, from the ⋯ menu only; the question is recorded
  // as skipped and the runner moves to the very next one, or the page leaves for the next practice, topic or course page.
  const skip = skipOffer(course, topic, activity, state.qIndex);
  const doSkip = () => {
    // written to the store and to storage before the page changes (a React-batched update would be lost)
    getProgressStore(offeringId).set((p) => skipQuestion(p, activity.id, question.id));
    flushPendingWrites();
    if (skip.kind === "question") {
      act({ type: "SKIP_QUESTION" });
      return;
    }
    window.location.assign(skip.href!);
  };
  // After a wrong answer, a quiet way back to a question skipped earlier (offered, never forced):
  // in this practice first, else the nearest earlier practice skipped ahead in.
  const skippedHere = (() => {
    const ids = activityProgress?.skippedQuestions ?? [];
    const i = activity.questions.findIndex((q, k) => k < state.qIndex && !state.completed[k] && ids.includes(q.id));
    return i >= 0 ? { index: i, label: activity.questions[i].label ?? `Challenge ${i + 1}` } : undefined;
  })();
  const skippedBefore = skippedHere ? undefined : topic.activities.find((a, i) => i < topic.activities.findIndex((x) => x.id === activity.id) && skippedAhead(progress.activities[a.id], a));

  // One marker per challenge: finished ones done, the one on screen current.
  const steps: ChallengeStep[] = activity.questions.map((q, i) => ({
    label: q.label ?? `Challenge ${i + 1}`,
    state: state.done || (state.completed[i] && i !== state.qIndex) ? "done" : i === state.qIndex ? "current" : "todo",
  }));

  if (state.done) {
    // The same next action as the topic page, with this practice counted as finished already
    // (the store is updated a moment later).
    const finished = { activities: { ...progress.activities, [activity.id]: { ...(activityProgress ?? { attempts: 0, hintsUsed: 0, independent: false, lastAt: 0 }), status: "completed" as const } } };
    return (
      <>
        <ChallengeSteps steps={steps} />
        <div className={styles.layout}>
          <ActivitySummary
            activity={activity}
            objectives={topic.objectives.map((o) => o.text)}
            attempts={activityProgress?.attempts ?? 0}
            hintsUsed={state.hintsUsedTotal}
            next={topicAction(course, topic, finished)}
            topicHref={`/courses/${course.id}/${topic.id}/`}
            onRestart={() => act({ type: "RESTART" })}
          />
          <div className={styles.tutor}>
            <TutorPanel name={product.owner.shortName} expression="proud" message={resolveMessage("ui.stage.done")} course={course.id} typingSpeed={prefs.typingSpeed} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <ChallengeSteps steps={steps} />
    <div className={styles.layout}>
      <div className={styles.tutor}>
        <TutorPanel name={product.owner.shortName} expression={state.expression} message={state.message} source={state.messageSource} course={course.id} messageSeq={state.messageSeq} typingSpeed={prefs.typingSpeed} />
      </div>

      <div className={styles.stage} ref={stageRef} data-testid="learning-stage" data-stage={stage} data-engaged={state.tutor.engaged || state.tutor.attempts > 0 || undefined} onInput={onEdit} onChange={onEdit}>
        <div className={styles.stageHead}>
          <p className={styles.eyebrow}>
            Challenge {state.qIndex + 1} of {activity.questions.length}
            {question.label ? ` · ${question.label}` : ""}
          </p>
          {/* while a walkthrough runs or after a correct answer the help row is gone, so the ⋯ menu stays reachable up here (as on main) */}
          {(stage === "explaining" || stage === "complete") && <SkipMenu allowed={skip.allowed} targetLabel={skip.targetLabel} onSkip={doSkip} />}
        </div>

        <QuestionView
          key={questionViewKey(variant, state)}
          variant={variant}
          last={state.last}
          stepIndex={state.stepIndex}
          locked={stage === "complete" || stage === "explaining"}
          explanation={state.explanation}
          onSubmit={(answer) => act({ type: "SUBMIT", answer })}
          onPredict={(i) => act({ type: "PREDICT", index: i })}
          onContinue={() => act({ type: "CONTINUE" })}
          onInput={onEdit}
        />

        {state.last && !state.last.result.correct && skippedHere && stage !== "explaining" && (
          <p className={styles.returnOffer}>
            Stuck? You skipped{" "}
            <button type="button" className={styles.returnLink} onClick={() => act({ type: "GO_TO_QUESTION", index: skippedHere.index })}>
              {skippedHere.label}
            </button>
            ; it leads here. Go back any time.
          </p>
        )}
        {state.last && !state.last.result.correct && skippedBefore && stage !== "explaining" && (
          <p className={styles.returnOffer}>
            Stuck? You skipped ahead in <a href={practiceHref(course, topic, skippedBefore)}>{skippedBefore.title}</a>; it covers this. Go back any time.
          </p>
        )}

        {stage !== "explaining" && stage !== "complete" && (
          <>
            {/* the named mistake stays as the first card beside every hint (#700) */}
            <HintReveal revealed={state.hints} diagnosis={state.tutor.diagnosis} course={course.id} />
            <StageControls
              hasHints={state.hints.length > 0}
              offer={state.offer}
              confirmRestart={state.confirmRestart}
              onHint={() => act({ type: "HINT", sinceStepMs: sinceStep() })}
              onStuck={() => act({ type: "STUCK", sinceStepMs: sinceStep() })}
              onExplain={() => act({ type: "EXPLAIN" })}
              onConfirmExplain={() => act({ type: "EXPLAIN", confirmed: true })}
              onCancelExplain={() => act({ type: "CANCEL_EXPLAIN" })}
            >
              <SkipMenu allowed={skip.allowed} targetLabel={skip.targetLabel} onSkip={doSkip} />
            </StageControls>
          </>
        )}

        {stage === "complete" && (
          <div className={styles.actions} role="group" aria-label="Next steps">
            {hasAnotherVariant(activity, state) && (
              <button type="button" className="btn" onClick={() => act({ type: "RETRY_VARIANT" })}>
                Try a similar one
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => act({ type: "NEXT_QUESTION" })}>
              {state.completed.every(Boolean) ? "Finish" : "Next challenge"}
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
