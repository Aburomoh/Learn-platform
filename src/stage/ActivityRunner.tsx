"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import type { Activity, Course, Topic } from "@/content/schema";
import { product } from "../../config/product";
import { HintReveal } from "@/interactions";
import { canRequestScaffold } from "@/tutor";
import { TutorPanel, useFocusEffects } from "@/tutor/ui";
import { useOfferingProgress, usePrefs, getProgressStore, startActivity, recordAttempt, completeActivity, completeQuestion } from "@/learner";
import { createRunnerReducer, initialRunnerState, resumeRunnerState, currentVariant, hasAnotherVariant, type RunnerState } from "./runnerReducer";
import { QuestionView } from "./QuestionView";
import { ActivitySummary } from "./ActivitySummary";
import { ChallengeSteps, type ChallengeStep } from "@/shell/r1";
import { topicAction } from "@/shell/primaryAction";
import styles from "./Stage.module.css";

export interface ActivityRunnerProps {
  course: Course;
  topic: Topic;
  activity: Activity;
}

const HESITATION_TICK_MS = 15_000;

const noSubscription = () => () => {};

/** Review links carry `?review=1`: restart at challenge 1 instead of resuming. */
function isReview(): boolean {
  return new URLSearchParams(window.location.search).has("review");
}

/**
 * Learning Stage entry. Local progress lives in the browser, so the first challenge to show is
 * only known after hydration. Until then an empty stage frame is rendered (also in the
 * pre-rendered HTML), so a returning student never sees challenge 1 flash before the one they
 * continue with.
 */
export function ActivityRunner(props: ActivityRunnerProps) {
  const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);
  if (!hydrated) {
    return (
      <div className={styles.layout}>
        <div className={`${styles.stage} ${styles.stageLoading}`} data-testid="learning-stage" data-stage="loading" aria-busy="true" />
      </div>
    );
  }
  return <Runner {...props} />;
}

/**
 * Learning Stage (layer B). Owns runner state, feeds events to the tutor engine, applies
 * structured actions to the UI, and records compact evidence in the local learner store.
 * Everything here runs in the browser; there are no network calls.
 */
function Runner({ course, topic, activity }: ActivityRunnerProps) {
  const offeringId = course.offeringId;
  const reducer = useMemo(() => createRunnerReducer(activity), [activity]);
  // Continue resumes at the first unfinished challenge; Review, or a finished practice, starts at challenge 1.
  const [initial] = useState<RunnerState>(() => {
    const record = getProgressStore(offeringId).get().activities[activity.id];
    if (isReview() || !record || record.status === "completed") return initialRunnerState(activity);
    return resumeRunnerState(activity, record.completedQuestions ?? []);
  });
  const [state, dispatch] = useReducer(reducer, initial);
  const [progress, updateProgress] = useOfferingProgress(offeringId);
  const [prefs] = usePrefs();
  const stageRef = useRef<HTMLDivElement>(null);
  const { apply } = useFocusEffects(stageRef);

  const question = activity.questions[state.qIndex];
  const variant = currentVariant(activity, state);

  // Open once: tutor greeting + progress "started".
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    dispatch({ type: "OPEN" });
    updateProgress((p) => startActivity(p, activity.id));
  }, [activity.id, updateProgress]);

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

  // Hesitation: time since the last meaningful interaction, sampled every 15 s.
  const lastInteraction = useRef(0);
  const touch = useCallback(() => {
    lastInteraction.current = Date.now();
  }, []);
  useEffect(() => {
    if (state.tutor.stage === "complete" || state.tutor.stage === "explaining" || state.done) return;
    lastInteraction.current = Date.now();
    const t = window.setInterval(() => {
      dispatch({ type: "HESITATION", seconds: Math.round((Date.now() - lastInteraction.current) / 1000) });
    }, HESITATION_TICK_MS);
    return () => window.clearInterval(t);
  }, [state.tutor.stage, state.done, state.qIndex, state.interactionKey]);

  const act = useCallback(
    (a: Parameters<typeof dispatch>[0]) => {
      touch();
      dispatch(a);
    },
    [touch],
  );

  const stage = state.tutor.stage;
  const scaffoldsOpen = canRequestScaffold(state.tutor);
  const activityProgress = progress.activities[activity.id];

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
            <TutorPanel name={product.owner.shortName} expression="pleased" message="Done. Come back any time to practise again." typingSpeed={prefs.typingSpeed} />
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
        <TutorPanel name={product.owner.shortName} expression={state.expression} message={state.message} messageSeq={state.messageSeq} typingSpeed={prefs.typingSpeed} />
      </div>

      <div className={styles.stage} ref={stageRef} data-testid="learning-stage" data-stage={stage}>
        <p className={styles.eyebrow}>
          Challenge {state.qIndex + 1} of {activity.questions.length}
          {question.label ? ` · ${question.label}` : ""}
        </p>

        <QuestionView
          key={`${variant.id}-${state.interactionKey}`}
          variant={variant}
          last={state.last}
          stepIndex={state.stepIndex}
          locked={stage === "complete" || stage === "explaining"}
          explanation={state.explanation}
          onSubmit={(answer) => act({ type: "SUBMIT", answer })}
          onPredict={(i) => act({ type: "PREDICT", index: i })}
          onContinue={() => act({ type: "CONTINUE" })}
        />

        {stage !== "explaining" && stage !== "complete" && (
          <HintReveal
            revealed={state.hints}
            canRequest={scaffoldsOpen && state.tutor.hintLevel < 9}
            lockedReason={!scaffoldsOpen ? "Try once first" : undefined}
            onRequest={() => act({ type: "HINT" })}
            onExplainSlowly={scaffoldsOpen ? () => act({ type: "EXPLAIN" }) : undefined}
          />
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
