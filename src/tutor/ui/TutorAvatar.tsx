"use client";

import { useState } from "react";
import type { Expression } from "../engine/actions";
import { monogram } from "./TutorCard";
import { poseSrc, type TutorPoseTable } from "./poses";
import { useReducedMotion } from "./useReducedMotion";
import styles from "./TutorAvatar.module.css";

export interface TutorAvatarProps {
  expression: Expression;
  /** Display name: the monogram and the accessible label come from it. */
  name: string;
  /** md 56 px beside the stage, sm 40 px in the compact strip. */
  size?: "sm" | "md";
  /** Pose table (`product.brand.tutorPortrait`); without one the monogram disc is shown. */
  portrait?: TutorPoseTable | null;
}

/**
 * The tutor inside the stage (R1 redesign §9): the owner's pose for the current expression in a
 * fixed-size disc, or a warm monogram disc for courses without art (or if the file fails). The
 * expression is kept as `data-expression` and in the accessible label. A pose change crossfades
 * (`--dur-fast`) unless the student asks for reduced motion.
 */
export function TutorAvatar({ expression, name, size = "md", portrait }: TutorAvatarProps) {
  const label = `${name}, ${LABELS[expression]}`;
  const reduced = useReducedMotion();
  const src = portrait ? poseSrc(portrait, expression) : null;
  // The pose on screen before this one, kept only while it fades out.
  const [shown, setShown] = useState(src);
  const [prev, setPrev] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  if (src !== shown) {
    setPrev(reduced ? null : shown);
    setShown(src);
  }

  return (
    <figure className={`${styles.root} ${size === "sm" ? styles.sm : ""}`} data-expression={expression}>
      {src && failed !== src ? (
        <span className={`${styles.disc} ${styles.photo}`}>
          {prev && prev !== src && (
            // eslint-disable-next-line @next/next/no-img-element -- static export, small local image
            <img key={prev} src={prev} alt="" aria-hidden="true" className={`${styles.pose} ${styles.out}`} onAnimationEnd={() => setPrev(null)} />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, small local image */}
          <img
            key={src}
            src={src}
            alt={label}
            width={168}
            height={168}
            decoding="async"
            className={`${styles.pose} ${prev ? styles.in : ""}`}
            onError={() => setFailed(src)}
          />
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
};
