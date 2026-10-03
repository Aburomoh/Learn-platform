import styles from "./r1.module.css";

export type StepState = "done" | "current" | "todo";

export interface ChallengeStep {
  /** Short label from content, e.g. "Divide". */
  label: string;
  state: StepState;
}

const STATE_TEXT: Record<StepState, string> = { done: "done", current: "current", todo: "not started" };

/**
 * One marker per challenge, in order (R1 redesign §4). Each state has its own shape (filled with a
 * check, ring, hairline ring) and hidden text, so colour is never the only signal.
 */
export function ChallengeSteps({ steps, label = "Challenges" }: { steps: ChallengeStep[]; label?: string }) {
  return (
    <ol className={styles.steps} aria-label={label}>
      {steps.map((step, i) => (
        <li key={i} className={styles[step.state]} data-state={step.state} aria-current={step.state === "current" ? "step" : undefined}>
          <span className={styles.dot} aria-hidden="true" />
          {step.label}
          <span className="sr-only"> — {STATE_TEXT[step.state]}</span>
        </li>
      ))}
    </ol>
  );
}

/** Step states from the challenges finished so far: the first unfinished one is current. */
export function stepsFrom(questions: { id: string; label?: string }[], completedIds: readonly string[], showCurrent = true): ChallengeStep[] {
  const firstOpen = questions.findIndex((q) => !completedIds.includes(q.id));
  return questions.map((q, i) => ({
    label: q.label ?? `Challenge ${i + 1}`,
    state: completedIds.includes(q.id) ? "done" : showCurrent && i === firstOpen ? "current" : "todo",
  }));
}
