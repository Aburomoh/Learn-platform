"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { Activity, Topic } from "@/content/schema";
import { product } from "../../config/product";
import { HintReveal } from "@/interactions";
import { canRequestScaffold } from "@/tutor";
import { TutorPanel, useFocusEffects } from "@/tutor/ui";
import { useOfferingProgress, usePrefs, startActivity, recordAttempt, completeActivity } from "@/learner";
import { createRunnerReducer, initialRunnerState, currentVariant, hasAnotherVariant } from "./runnerReducer";
import { QuestionView } from "./QuestionView";
import { ActivitySummary } from "./ActivitySummary";
import styles from "./Stage.module.css";

export interface ActivityRunnerProps {
  offeringId: string;
  topic: Topic;
  activity: Activity;
  backHref: string;
}

const HESITATION_TICK_MS = 15_000;

/**
 * Learning Stage (layer B). Owns runner state, feeds events to the tutor engine, applies
 * structured actions to the UI, and records compact evidence in the local learner store.
 * Everything here runs in the browser; there are no network calls.
 */
export function ActivityRunner({ offeringId, topic, activity, backHref }: ActivityRunnerProps) {
  const reducer = useMemo(() => createRunnerReducer(activity), [activity]);
  const [state, dispatch] = useReducer(reducer, activity, initialRunnerState);
  const [progress, updateProgress] = useOfferingProgress(offeringId);
  const [prefs] = usePrefs();
  const stageRef = useRef<HTMLDivElement>(null);
  const { apply } = useFocusEffects(stageRef);

  const question = activity.questions[state.qIndex];
  const variant = currentVariant(activity, state);
  const concept = topic.concepts.find((c) => c.id === question.conceptId);

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

  if (state.done) {
    return (
      <div className={styles.layout}>
        <ActivitySummary activity={activity} attempts={activityProgress?.attempts ?? 0} hintsUsed={state.hintsUsedTotal} backHref={backHref} onRestart={() => act({ type: "RESTART" })} />
        <div className={styles.tutor}>
          <TutorPanel name={product.owner.shortName} expression="pleased" message="Done. Come back any time to practise again." typingSpeed={prefs.typingSpeed} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.tutor}>
        <TutorPanel name={product.owner.shortName} expression={state.expression} message={state.message} messageSeq={state.messageSeq} typingSpeed={prefs.typingSpeed} />
      </div>

      <div className={styles.stage} ref={stageRef} data-testid="learning-stage" data-stage={stage}>
        <header className={styles.header}>
          <span className={styles.step}>
            Question {state.qIndex + 1} of {activity.questions.length}
          </span>
          {concept && <span className={styles.concept}>{concept.title}</span>}
        </header>

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
              {state.completed.every(Boolean) ? "Finish" : "Next question"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
