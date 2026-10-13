"use client";

import Link from "next/link";
import { useState } from "react";
import { resolveMessage } from "@/tutor/messages";
import styles from "./r1.module.css";

export interface Crumb {
  label: string;
  /** Absent for the current place (plain text, `aria-current`). */
  href?: string;
}

/**
 * Where am I (epic #670, #674): "ECET 111 · Chapter 1 · Binary arithmetic" under the top bar of
 * topic and practice pages, each segment a link to its level (the chapter one to the course
 * page's `#chapter-<id>`, which opens that chapter). On phones only the two nearest segments show
 * and an "…" button reveals the rest inline. Browser Back and the top bar's "← parent" are
 * untouched: this line answers "where", they answer "back" and "up".
 */
export function LocationLine({ segments }: { segments: Crumb[] }) {
  const [open, setOpen] = useState(false);
  const collapsed = open ? 0 : Math.max(0, segments.length - 2);
  return (
    <nav className={styles.location} aria-label={resolveMessage("ui.nav.here")} data-open={open || undefined}>
      <ol className={styles.locationList}>
        {collapsed > 0 && (
          <li className={styles.locationMore}>
            <button type="button" className={styles.locationButton} aria-label={resolveMessage("ui.nav.show-path")} aria-expanded={false} onClick={() => setOpen(true)}>
              …
            </button>
          </li>
        )}
        {segments.map((s, i) => (
          <li key={`${i}-${s.label}`} className={styles.locationItem} data-collapsed={i < collapsed ? "" : undefined}>
            {i > 0 && (
              <span aria-hidden="true" className={styles.locationSep}>
                ·
              </span>
            )}
            {s.href ? (
              <Link href={s.href} className={styles.locationLink}>
                {s.label}
              </Link>
            ) : (
              <span className={styles.locationHere} aria-current="page">
                {s.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** "Chapter 2 · Boolean Algebra and Logic Gates" → "Chapter 2": the short name for the line. */
export const chapterShort = (title: string) => title.split("·")[0].trim();
