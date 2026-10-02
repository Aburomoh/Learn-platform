import { fill, type TemplateVars } from "@/content/template";
import { en } from "./en";

/** Locale catalogs. A future `ar` catalog overrides keys; missing keys fall back to `en`. */
const catalogs: Record<string, Record<string, string>> = { en };

export function hasMessage(key: string): boolean {
  return key in en;
}

export function resolveMessage(key: string, vars: TemplateVars = {}, locale = "en"): string {
  const text = catalogs[locale]?.[key] ?? en[key];
  if (text === undefined) {
    // Visible fallback so authoring mistakes are caught in tests and demos, never silent.
    return `[missing message: ${key}]`;
  }
  return fill(text, vars);
}

export function messageKeys(): string[] {
  return Object.keys(en);
}
