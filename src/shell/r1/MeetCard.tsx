"use client";

import { useState } from "react";
import type { Topic } from "@/content/schema";
import { Notation } from "@/interactions/shared/Notation";
import { FigureView } from "@/kinds/shared/figures/FigureView";
import styles from "./r1.module.css";

/**
 * The topic's "meet it" card (visual system §11): the device's symbol with one worked case in its
 * result state, and three numbered callouts. The same numbers sit on the figure over the inputs,
 * the body and the outputs, so text and picture point at each other. On phones the callouts wait
 * behind "How it works" so the Start button stays on the first screen. No interaction on the figure.
 */
export function MeetCard({ id, meet }: { id: string; meet: NonNullable<Topic["meet"]> }) {
  const [open, setOpen] = useState(false);
  const listId = `${id}-how`;
  return (
    <div className={styles.meet}>
      <FigureView id={`${id}-meet`} figure={meet.figure} revealed marks />
      <button type="button" className={`btn btn-quiet ${styles.meetToggle}`} aria-expanded={open} aria-controls={listId} onClick={() => setOpen((o) => !o)}>
        How it works
      </button>
      <ol id={listId} className={styles.callouts} data-open={open}>
        {meet.callouts.map((text, i) => (
          <li key={i}>
            <span className={styles.calloutNumber} aria-hidden="true">
              {i + 1}
            </span>
            <span>
              <span className="sr-only">{i + 1}. </span>
              <Notation text={text} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
