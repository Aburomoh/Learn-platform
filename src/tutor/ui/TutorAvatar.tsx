"use client";

import { useState } from "react";
import type { Expression } from "../engine/actions";
import { monogram } from "./TutorCard";
import { PosePicture } from "./PosePicture";
import type { TutorPoseTable } from "./poses";
import { useReducedMotion } from "./useReducedMotion";
import styles from "./TutorAvatar.module.css";

export interface TutorAvatarProps {
  expression: Expression;
  /** Tutor display name (from product config); the monogram is derived from it. */
  name: string;
  /** Pose table (`product.brand.tutorPortrait`); without one the monogram disc is shown. */
  portrait?: TutorPoseTable | null;
}

/**
 * The tutor inside the stage (DESIGN_SYSTEM.md, Tutor area). From 1200 px, beside the stage: the
 * waist-up pose in a fixed 168 × 224 box. Below that, in the strip: the 40 px head crop. Only the
 * selected file is fetched (see `PosePicture`). Without art, or if a file fails, the monogram disc
 * (56 px / 40 px). A new pose crossfades in `--dur-fast` once it has loaded; under reduced motion it
 * replaces the old one at once. The expression is kept as `data-expression` and is the alt text.
 */
export function TutorAvatar({ expression, name, portrait }: TutorAvatarProps) {
  const label = `${name}, ${LABELS[expression]}`;
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(expression);
  // Whether `shown` has loaded; the pose before it stays on screen until then.
  const [loaded, setLoaded] = useState(true);
  const [prev, setPrev] = useState<Expression | null>(null);
  const [failed, setFailed] = useState<Expression | null>(null);
  if (expression !== shown) {
    setPrev(loaded ? shown : prev);
    setShown(expression);
    setLoaded(false);
  }
  const art = portrait && failed !== expression ? portrait : null;
  const fading = prev !== null && prev !== expression;

  return (
    <figure className={styles.root} data-expression={expression} data-art={art ? "" : undefined}>
      {art ? (
        <span className={styles.frame}>
          {fading && (
            <span key={prev} className={`${styles.layer} ${loaded ? styles.out : ""}`} onAnimationEnd={() => setPrev(null)}>
              <PosePicture portrait={art} pose={prev} column="stage" alt="" />
            </span>
          )}
          <span key={expression} className={`${styles.layer} ${fading ? (loaded ? styles.in : styles.pending) : ""}`}>
            <PosePicture
              portrait={art}
              pose={expression}
              column="stage"
              alt={label}
              onLoad={() => {
                setLoaded(true);
                if (reduced) setPrev(null);
              }}
              onError={() => {
                setFailed(expression);
                setPrev(null);
              }}
            />
          </span>
        </span>
      ) : (
        <span className={styles.disc} role="img" aria-label={label}>
          {monogram(name)}
        </span>
      )}
    </figure>
  );
}

const LABELS: Record<Expression, string> = {
  neutral: "neutral",
  explaining: "explaining",
  thinking: "thinking",
  curious: "curious",
  encouraging: "encouraging",
  concern: "slightly concerned",
  pleased: "pleased",
  pointing: "pointing",
  "attention-left": "looking left",
  "attention-right": "looking right",
  insight: "having an insight",
  proud: "proud",
  reassuring: "reassuring",
  caution: "cautious",
};
