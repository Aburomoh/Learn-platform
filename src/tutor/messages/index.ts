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

export function messageKeys(): string[] {
  return Object.keys(en);
}

/** Keys a locale has not translated yet (empty or absent). */
export function untranslatedKeys(locale: string): string[] {
  return messageKeys().filter((k) => !catalogs[locale]?.[k]);
}
