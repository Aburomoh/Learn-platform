"use client";

import { Fragment } from "react";
import { fill, type TemplateVars } from "@/content/template";
import { Notation } from "@/interactions/shared/Notation";
import { useArabic } from "./arabic";
import { isArabic, splitBidi } from "./bidi";
import styles from "./l10n.module.css";

/** Arabic text as React children with each English run isolated LTR; never raw HTML. */
export function BidiText({ text }: { text: string }) {
  return (
    <>
      {splitBidi(text).map((run, i) =>
        "ltr" in run ? (
          <bdi key={i} dir="ltr">
            <Notation text={run.ltr} />
          </bdi>
        ) : (
          <Fragment key={i}>{run.rtl}</Fragment>
        ),
      )}
    </>
  );
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
  if (text === template || !isArabic(text)) return <Notation text={fill(template, vars)} />;
  return (
    <span dir="rtl" lang="ar" className={`${styles.ar} ${inline ? styles.inline : ""}`}>
      <BidiText text={fill(text, vars)} />
    </span>
  );
}
