"use client";

import type { Expression } from "../engine/actions";
import { monogram } from "./TutorCard";
import styles from "./TutorAvatar.module.css";

export interface TutorAvatarProps {
  expression: Expression;
  /** Display name: the monogram and the accessible label come from it. */
  name: string;
  /** md 56 px beside the stage, sm 40 px in the compact strip. */
  size?: "sm" | "md";
  /** Approved portrait (`product.brand.tutorPortrait`); until one exists the monogram disc is shown. */
  portraitSrc?: string | null;
}

/**
 * The tutor inside the stage (R1 redesign §9): a warm monogram disc, never a stock face and
 * never a developer caption. The current expression is kept as `data-expression` and in the
 * accessible label, so approved artwork per expression can replace the disc later without
 * changing the API.
 */
export function TutorAvatar({ expression, name, size = "md", portraitSrc }: TutorAvatarProps) {
  const label = `${name}, ${LABELS[expression]}`;
  return (
    <figure className={`${styles.root} ${size === "sm" ? styles.sm : ""}`} data-expression={expression}>
      {portraitSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- static export, small local image
        <img src={portraitSrc} alt={label} className={styles.disc} />
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
