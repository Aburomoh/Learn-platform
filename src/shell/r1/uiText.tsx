"use client";

import Link from "next/link";
import { useCallback, type ReactNode } from "react";
import { fill, type TemplateVars } from "@/content/template";
import { useArabic } from "@/l10n/arabic";
import { isArabic } from "@/l10n/bidi";
import { BidiText, SupportiveText } from "@/l10n/SupportiveText";
import l10n from "@/l10n/l10n.module.css";
import { messageTemplate, pluralKey } from "@/tutor/messages";
import type { ActionLink } from "./PrimaryAction";

/**
 * Catalogue strings of the chrome (navigation labels, summary and numeric sentences) read through
 * the Arabic layer (#705, ADR-0011): the lookup is the key's English template, from the shared map,
 * so the owner's approved Arabic renders once it is in the package; a missing one falls back to
 * the English exactly as today. Titles and terms stay English and are isolated LTR by `BidiText`.
 */
export function useUiText() {
  const { locale, translate } = useArabic();
  /** The text of a key, in the learner's language, slots filled: for attributes (aria-label) and props. */
  const t = useCallback((key: string, vars: TemplateVars = {}) => fill(translate(messageTemplate(key)), vars), [translate]);
  /** Count agreement: the English form for `n` is the lookup (ADR-0011 §6); `n` is also the `{n}` slot. */
  const tp = useCallback((key: string, n: number, vars: TemplateVars = {}) => t(pluralKey(key, n, "en"), { n, ...vars }), [t]);
  return { locale, t, tp };
}

/** A catalogue line: its key and slots. `text` (the English) is what pure helpers return beside it, for tests and data attributes. */
export interface UiLine {
  key: string;
  vars?: TemplateVars;
}

/** Renders a `UiLine`. */
export function LineText({ line }: { line: UiLine }) {
  return <UiText k={line.key} vars={line.vars} />;
}

/** A catalogue string as text: Arabic `dir="rtl" lang="ar"` on this element only when translated; else the English. */
export function UiText({ k, vars, inline = true }: { k: string; vars?: TemplateVars; inline?: boolean }) {
  return <SupportiveText template={messageTemplate(k)} vars={vars} inline={inline} />;
}

/** The label of an action link: translated when the resolver gave it a template (`actionLink`), else as written. */
export function ActionText({ link }: { link: ActionLink }) {
  if (!link.template) return <>{link.label}</>;
  return <SupportiveText template={link.template} vars={link.vars} inline />;
}

/** The label of a link, as a string, for an `aria-label`. */
export function useActionLabel() {
  const { translate } = useArabic();
  return useCallback((link: ActionLink) => (link.template ? fill(translate(link.template), link.vars ?? {}) : link.label), [translate]);
}

/**
 * A quiet row action ("Continue · Binary addition →") whose accessible name also says which row.
 * Used by Home's course rows and the course page's topic rows.
 */
export function RowActionLink({ link, title, className, children }: { link: ActionLink; title: string; className?: string; children?: ReactNode }) {
  const label = useActionLabel();
  return (
    <Link href={link.href} className={className} aria-label={`${label(link)}: ${title}`}>
      <ActionText link={link} /> <span aria-hidden="true">→</span>
      {children}
    </Link>
  );
}

/**
 * The top bar's "← parent" text (#705): the clipped element itself carries `dir` from the language,
 * so the ellipsis falls at the end of Arabic text. English (a course code, a topic title) renders as before.
 */
export function BackLabel({ link }: { link: ActionLink }) {
  const { translate } = useArabic();
  const text = link.template ? translate(link.template) : link.label;
  if (!link.template || text === link.template || !isArabic(text)) return <span>{link.label}</span>;
  return (
    <span dir="rtl" lang="ar" className={`${l10n.ar} ${l10n.inline}`}>
      <BidiText text={fill(text, link.vars ?? {})} />
    </span>
  );
}
