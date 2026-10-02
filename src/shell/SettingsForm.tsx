"use client";

import { useState } from "react";
import { clearLocalData, usePrefs } from "@/learner";
import styles from "./Shell.module.css";

export function SettingsForm() {
  const [prefs, setPrefs] = usePrefs();
  const [cleared, setCleared] = useState<number | null>(null);

  return (
    <div className={styles.list}>
      <section className={styles.card}>
        <h2>Tutor typing</h2>
        <p className={styles.lead}>How fast the tutor&apos;s messages appear. You can always click a message to show it at once.</p>
        <label>
          Speed{" "}
          <select value={prefs.typingSpeed} onChange={(e) => setPrefs({ typingSpeed: Number(e.target.value) })}>
            <option value={0}>Instant</option>
            <option value={30}>Slow</option>
            <option value={45}>Normal</option>
            <option value={80}>Fast</option>
          </select>
        </label>
      </section>

      <section className={styles.card}>
        <h2>Your data</h2>
        <p className={styles.lead}>
          Progress and preferences are stored only in this browser, for this course offering. Nothing is sent to a server. You can remove it
          at any time.
        </p>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setCleared(clearLocalData());
          }}
        >
          Clear my local data
        </button>
        {cleared !== null && (
          <p role="status" className={styles.meta}>
            Cleared. Your progress has been reset.
          </p>
        )}
      </section>
    </div>
  );
}
