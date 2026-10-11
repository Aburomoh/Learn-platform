"use client";

import { usePrefs, type Prefs } from "@/learner";
import { loadArabic, SHARED } from "@/l10n/arabic";
import styles from "./r1.module.css";

type Locale = Prefs["locale"];

/**
 * `EN | عربي` in the top bar (ADR-0011 §4): two text buttons, the active one pressed, at every
 * width and never an icon alone. The choice is the learner's `locale` preference (ADR-0005): it
 * applies at once, site-wide, and persists. Only supportive text changes language; the layout
 * is never mirrored.
 */
export function LanguageToggle() {
  const [prefs, setPrefs] = usePrefs();
  const current: Locale = prefs.locale === "ar" ? "ar" : "en";
  const choose = (locale: Locale) => {
    if (locale !== current) setPrefs({ locale });
    if (locale === "ar") void loadArabic(SHARED);
  };
  return (
    <div className={styles.lang} role="group" aria-label="Language">
      <button type="button" className={styles.langChoice} lang="en" aria-pressed={current === "en"} onClick={() => choose("en")}>
        EN
      </button>
      <span className={styles.langSep} aria-hidden="true">
        |
      </span>
      <button type="button" className={styles.langChoice} lang="ar" aria-pressed={current === "ar"} onClick={() => choose("ar")}>
        عربي
      </button>
    </div>
  );
}
