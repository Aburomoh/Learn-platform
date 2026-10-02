"use client";

import type { Expression } from "../engine/actions";
import styles from "./TutorAvatar.module.css";

export interface TutorAvatarProps {
  expression: Expression;
  /** Display name for the accessible label. */
  name: string;
  size?: "sm" | "md";
}

/**
 * PLACEHOLDER avatar. A simple line-drawn face whose brows, eyes and mouth change per
 * expression. Replace the SVG per expression with approved artwork once reference photos
 * exist; the API (expression → image) stays the same.
 */
export function TutorAvatar({ expression, name, size = "md" }: TutorAvatarProps) {
  const f = FACES[expression];
  return (
    <figure className={`${styles.root} ${size === "sm" ? styles.sm : ""}`} data-expression={expression}>
      <svg viewBox="0 0 100 100" className={styles.svg} role="img" aria-label={`${name}, ${LABELS[expression]}`}>
        <circle cx="50" cy="50" r="46" className={styles.head} />
        {/* brows */}
        <path d={f.browL} className={styles.line} />
        <path d={f.browR} className={styles.line} />
        {/* eyes */}
        <circle cx={38 + f.gaze} cy="46" r={f.eye} className={styles.eye} />
        <circle cx={62 + f.gaze} cy="46" r={f.eye} className={styles.eye} />
        {/* mouth */}
        <path d={f.mouth} className={styles.line} />
        {f.hand && <path d={f.hand} className={styles.hand} />}
      </svg>
      <figcaption className={styles.caption}>placeholder · {expression}</figcaption>
    </figure>
  );
}

interface Face {
  browL: string;
  browR: string;
  eye: number;
  gaze: number;
  mouth: string;
  hand?: string;
}

const FACES: Record<Expression, Face> = {
  neutral: { browL: "M28 36 Q38 33 46 36", browR: "M54 36 Q62 33 72 36", eye: 3, gaze: 0, mouth: "M38 66 Q50 70 62 66" },
  explaining: { browL: "M28 34 Q38 30 46 34", browR: "M54 34 Q62 30 72 34", eye: 3.2, gaze: 0, mouth: "M36 64 Q50 76 64 64" },
  thinking: { browL: "M28 38 Q38 32 46 36", browR: "M54 33 Q62 31 72 36", eye: 3, gaze: 3, mouth: "M40 68 Q50 66 60 70" },
  curious: { browL: "M28 34 Q38 28 46 34", browR: "M54 34 Q62 28 72 34", eye: 3.6, gaze: 0, mouth: "M42 66 Q50 72 58 66" },
  encouraging: { browL: "M28 35 Q38 31 46 35", browR: "M54 35 Q62 31 72 35", eye: 3, gaze: 0, mouth: "M34 64 Q50 78 66 64" },
  concern: { browL: "M28 38 Q38 36 46 40", browR: "M54 40 Q62 36 72 38", eye: 3, gaze: 0, mouth: "M40 70 Q50 64 60 70" },
  pleased: { browL: "M28 35 Q38 31 46 35", browR: "M54 35 Q62 31 72 35", eye: 2.6, gaze: 0, mouth: "M32 62 Q50 80 68 62" },
  pointing: { browL: "M28 35 Q38 31 46 35", browR: "M54 35 Q62 31 72 35", eye: 3, gaze: 4, mouth: "M38 66 Q50 72 62 66", hand: "M78 70 l12 -14 l4 4 l-10 12 z" },
  "attention-left": { browL: "M28 35 Q38 31 46 35", browR: "M54 35 Q62 31 72 35", eye: 3, gaze: -5, mouth: "M38 66 Q50 70 62 66" },
  "attention-right": { browL: "M28 35 Q38 31 46 35", browR: "M54 35 Q62 31 72 35", eye: 3, gaze: 5, mouth: "M38 66 Q50 70 62 66" },
};

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
