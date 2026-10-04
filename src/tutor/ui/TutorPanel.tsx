"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Expression } from "../engine/actions";
import { product } from "../../../config/product";
import { TutorAvatar } from "./TutorAvatar";
import { TutorBubble } from "./TutorBubble";
import styles from "./TutorPanel.module.css";

export interface TutorPanelProps {
  name: string;
  expression: Expression;
  message: string;
  /** Changes whenever the tutor speaks, even if the text repeats. Defaults to the text itself. */
  messageSeq?: number;
  typingSpeed?: number;
  onMessageDone?: () => void;
}

/** Keys that scroll the page. */
const SCROLL_KEYS = new Set(["PageDown", "PageUp", "Home", "End"]);

/**
 * Instructor beside the whiteboard: avatar plus one short bubble. Quiet when there is no message.
 *
 * Below the `lg` breakpoint the panel is a strip above the stage. Unread text is never clamped: a
 * new message shows in full (the strip grows, and scrolls inside itself beyond 40svh). It
 * collapses to two lines only once the message is stale — the student's next input or click
 * elsewhere, or a page scroll — and can be reopened by tapping it or with the toggle; Escape
 * collapses it.
 */
export function TutorPanel({ name, expression, message, messageSeq, typingSpeed, onMessageDone }: TutorPanelProps) {
  const bubbleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const key = messageSeq ?? message;
  // The collapsed/expanded choice belongs to one message; a new message starts open again.
  const [choice, setChoice] = useState<{ key: string | number; open: boolean } | null>(null);
  const open = message !== "" && (choice?.key === key ? choice.open : true);
  const setOpen = (value: boolean) => setChoice({ key, open: value });

  // A message becomes stale when the student moves on: typing, clicking elsewhere, or scrolling
  // the page themselves (wheel, touch or keys; programmatic scrolling for focus does not count).
  useEffect(() => {
    if (!message) return;
    const stale = () => setChoice((c) => (c?.key === key ? c : { key, open: false }));
    const outside = (e: Event) => {
      if (!panelRef.current?.contains(e.target as Node)) stale();
    };
    const onKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) outside(e);
    };
    const events = ["click", "input", "wheel", "touchmove"] as const;
    for (const type of events) document.addEventListener(type, outside, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      for (const type of events) document.removeEventListener(type, outside);
      document.removeEventListener("keydown", onKey);
    };
  }, [key, message]);

  // scroll-padding-top follows the strip's live height, and a grown strip never covers the
  // element the student is working in.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver === "undefined") return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      const box = panel.getBoundingClientRect();
      root.style.setProperty("--tutor-live-h", `${Math.round(box.height)}px`);
      const focused = document.activeElement;
      if (!focused || focused === document.body || panel.contains(focused)) return;
      if (getComputedStyle(panel.parentElement ?? panel).position !== "sticky") return;
      const gap = focused.getBoundingClientRect().top - box.bottom - 8;
      if (gap < 0) window.scrollBy(0, gap);
    });
    observer.observe(panel);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--tutor-live-h");
    };
  }, []);

  return (
    <aside
      ref={panelRef}
      className={styles.panel}
      aria-label="Tutor"
      data-expanded={open}
      onClick={(e) => {
        // A tap on the bubble while it is still typing only completes the text.
        if ((e.target as Element).closest("[data-complete='false']")) return;
        if (message) setOpen(!open);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <div className={styles.avatar}>
        <TutorAvatar expression={expression} name={name} portrait={product.brand.tutorPortrait} />
      </div>
      <div className={styles.avatarSm}>
        <TutorAvatar expression={expression} name={name} size="sm" portrait={product.brand.tutorPortrait} />
      </div>
      {message ? (
        <div id={bubbleId} className={styles.message}>
          <TutorBubble text={message} speed={typingSpeed} onDone={onMessageDone} placement="side" />
        </div>
      ) : (
        <div className={styles.quiet} aria-hidden="true" />
      )}
      {message && (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={bubbleId}
          aria-label={open ? "Show less of the tutor message" : "Show the whole tutor message"}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <span aria-hidden="true">{open ? "▴" : "▾"}</span>
        </button>
      )}
    </aside>
  );
}
