import { fill, type TemplateVars } from "@/content/template";
import { en, type MessageKey } from "./en";
import { ar } from "./ar";

export type { MessageKey };

/** Locale catalogs. Missing or empty (untranslated) keys fall back to `en`. */
const catalogs: Record<string, Record<string, string>> = { en, ar };

export const LOCALES = Object.keys(catalogs);

export function hasMessage(key: string): boolean {
  return key in en;
}

export function resolveMessage(key: string, vars: TemplateVars = {}, locale = "en"): string {
  const text = catalogs[locale]?.[key] || (en as Record<string, string>)[key];
  if (text === undefined) {
    // Visible fallback so authoring mistakes are caught in tests and demos, never silent.
    return `[missing message: ${key}]`;
  }
  return fill(text, vars);
}

/** The English template of a key, unfilled: the lookup key for its Arabic (ADR-0011 §2). */
export function messageTemplate(key: string): string {
  return (en as Record<string, string>)[key] ?? `[missing message: ${key}]`;
}

/**
 * Count agreement (ADR-0011 §6): a template family `<key>.<form>` with one form per CLDR plural
 * class of the locale (`one` and `other` in English; `zero`, `one`, `two`, `few`, `many`, `other` in
 * Arabic). Picks the form for `n`, falling back to `other`; `n` is also the `{n}` slot.
 */
export function pluralKey(key: string, n: number, locale = "en"): string {
  let form = "other";
  try {
    form = new Intl.PluralRules(locale).select(n);
  } catch {
    form = n === 1 ? "one" : "other";
  }
  return hasMessage(`${key}.${form}`) ? `${key}.${form}` : `${key}.other`;
}

export function resolvePlural(key: string, n: number, vars: TemplateVars = {}, locale = "en"): string {
  return resolveMessage(pluralKey(key, n, locale), { n, ...vars }, locale);
}

export function messageKeys(): string[] {
  return Object.keys(en);
}

/** Keys a locale has not translated yet (empty or absent). */
export function untranslatedKeys(locale: string): string[] {
  return messageKeys().filter((k) => !catalogs[locale]?.[k]);
}
