"use client";

import { useId } from "react";
import { Notation } from "../shared/Notation";
import styles from "./PredictionBeforeReveal.module.css";

export interface PredictionResult {
  chosenIndex: number;
  correct: boolean;
  /** Text revealed after the prediction (afterCorrect / afterWrong from content). */
  reveal?: string;
}

export interface PredictionBeforeRevealProps {
  id: string;
  prompt: string;
  options: string[];
  onPredict: (index: number) => void;
  result?: PredictionResult;
  disabled?: boolean;
}

/**
 * Ask → commit → reveal. The student must choose before the continuation text appears.
 * Used inside Explain Slowly steps; one idea, two to four options.
 */
export function PredictionBeforeReveal({ id, prompt, options, onPredict, result, disabled = false }: PredictionBeforeRevealProps) {
  const promptId = useId();
  const committed = result !== undefined;
  return (
    <div className={styles.root} data-prediction={id}>
      <p id={promptId} className={styles.prompt}>
        <Notation text={prompt} />
      </p>
      <div role="group" aria-labelledby={promptId} className={styles.options}>
        {options.map((text, i) => {
          const chosen = result?.chosenIndex === i;
          const cls = chosen ? (result.correct ? styles.correct : styles.incorrect) : "";
          return (
            <button
              key={i}
              type="button"
              className={`btn ${styles.option} ${cls}`}
              onClick={() => onPredict(i)}
              disabled={disabled || committed}
              aria-pressed={chosen || undefined}
            >
              <Notation text={text} />
            </button>
          );
        })}
      </div>
      {committed && result.reveal && (
        <p className={`${styles.reveal} ${result.correct ? styles.revealOk : styles.revealNo}`} role="status">
          <Notation text={result.reveal} />
        </p>
      )}
    </div>
  );
}
