"use client";

import { Fragment, type ReactNode } from "react";
import { fill, type TemplateVars } from "@/content/template";
import { Notation } from "@/interactions/shared/Notation";
import { useArabic } from "./arabic";
import { isArabic, splitBidi } from "./bidi";
import styles from "./l10n.module.css";

/** A trailing "label: " (one or two words) of an Arabic run, kept on one line with the number that follows (#705, QA on #714). */
const LABEL_TAIL = /((?:\S+\s)?\S+:\s)$/;
/** Only a short value (a count, a number, one token) is kept with its label; a list or a sentence wraps as usual (QA on #714). */
const SHORT_VALUE = /^\S{1,12}$/;

/**
 * Arabic text as React children with each English run isolated LTR; never raw HTML. A label:value
 * phrase («المحاولات: 3») is wrapped so the label and its number never split at a line end.
 */
export function BidiText({ text }: { text: string }) {
  const runs = splitBidi(text);
  const out: ReactNode[] = [];
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    if ("ltr" in run) {
      out.push(
        <bdi key={i} dir="ltr">
          <Notation text={run.ltr} />
        </bdi>,
      );
      continue;
    }
    const next = runs[i + 1];
    const following = next && "ltr" in next && SHORT_VALUE.test(next.ltr) ? next : undefined;
    const m = following ? run.rtl.match(LABEL_TAIL) : null;
    if (!m || !following) {
      out.push(<Fragment key={i}>{run.rtl}</Fragment>);
      continue;
    }
    out.push(<Fragment key={i}>{run.rtl.slice(0, -m[1].length)}</Fragment>);
    out.push(
      <span key={`${i}-pair`} className={styles.pair}>
        {m[1]}
        <bdi dir="ltr">
          <Notation text={following.ltr} />
        </bdi>
      </span>,
    );
    i += 1;
  }
  return <>{out}</>;
}

export interface SupportiveTextProps {
  /** The English template, before its slots are filled: the lookup key. */
  template: string;
  vars?: TemplateVars;
  /** Course id for the course map; the shared map is always consulted. */
  course?: string;
  /** Render inline (inside a sentence) instead of as its own text block. */
  inline?: boolean;
}

/**
 * Supportive text in the learner's language (ADR-0011 §5): the Arabic for the English template when
 * Arabic is on and translated, else the English exactly as today. Arabic is `dir="rtl" lang="ar"` on
 * this element only, with English runs in `<bdi dir="ltr">`.
 */
export function SupportiveText({ template, vars = {}, course, inline = false }: SupportiveTextProps) {
  const { translate } = useArabic(course);
  const text = translate(template);
  if (text === template) return <Notation text={fill(template, vars)} />;
  // the translation may hold no Arabic letter of its own ("+{n}", "{activity} · {attempts}"): it is
  // still the owner's text, and its direction follows what the filled line holds (#710)
  const filled = fill(text, vars);
  if (!isArabic(filled)) return <Notation text={filled} />;
  return (
    <span dir="rtl" lang="ar" className={`${styles.ar} ${inline ? styles.inline : ""}`}>
      <BidiText text={filled} />
    </span>
  );
}
