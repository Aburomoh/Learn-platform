"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePrefs } from "@/learner";
import { applyTheme, DEFAULT_THEME, type Theme } from "../theme";
import { UiText, useUiText } from "./uiText";
import styles from "./r1.module.css";

/**
 * Profile button in the top bar (R1 redesign §8): a person icon, plus "Guest" from 641 px up,
 * opening a small panel with what Guest means, a link to Settings and the Appearance choice.
 * A disclosure (button + panel), not an ARIA menu: Escape or a click outside closes it and focus
 * returns to the button.
 */
export function ProfileMenu() {
  const { t } = useUiText();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = usePrefs();
  const panelId = useId();
  const themeId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const theme = prefs.theme ?? DEFAULT_THEME;

  useEffect(() => {
    if (!open) return;
    const outside = (e: Event) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  return (
    <div
      className={styles.profile}
      ref={rootRef}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <button ref={buttonRef} type="button" className={styles.util} aria-expanded={open} aria-controls={panelId} aria-label={t("ui.profile.menu")} onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className={styles.utilIcon}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </svg>
        <span className={styles.utilText}>
          <UiText k="ui.profile.guest" />
        </span>
      </button>
      {open && (
        <div id={panelId} className={styles.profilePanel}>
          <p className={styles.profileNote}>
            <strong>
              <UiText k="ui.profile.you-are-guest" />
            </strong>{" "}
            <UiText k="ui.profile.local" />
          </p>
          <label htmlFor={themeId} className={styles.profileRow}>
            <UiText k="ui.profile.appearance" />
            <select
              id={themeId}
              value={theme}
              onChange={(e) => {
                const next = e.target.value as Theme;
                setPrefs({ theme: next });
                applyTheme(next);
              }}
            >
              <option value="light">{t("ui.profile.light")}</option>
              <option value="dark">{t("ui.profile.dark")}</option>
              <option value="system">{t("ui.profile.system")}</option>
            </select>
          </label>
          <Link href="/settings/" className={styles.profileLink} onClick={() => setOpen(false)}>
            <UiText k="ui.profile.settings" />
          </Link>
        </div>
      )}
    </div>
  );
}
