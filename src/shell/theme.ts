/**
 * Theme choice (R1 redesign §6): light by default; dark or "match device" only when the student
 * picks it in Settings. The choice lives in the prefs record in localStorage and is applied as
 * `data-theme` on <html> (see src/styles/tokens.css).
 *
 * No "use client" here: the root layout (a server component) inlines `themeScript` in <head>.
 */
import { product } from "../../config/product";

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = "light";

/** Same key as `PREFS_KEY` in src/learner/store.ts (a client module, so not importable here). */
export const THEME_PREFS_KEY = `${product.storagePrefix}:prefs`;

/**
 * Runs before first paint so the page never flashes the wrong theme. By rule (Technical Lead,
 * #129) it only reads the prefs key and sets `data-theme`: no other logic, no network.
 */
export const themeScript = `try{var t=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_PREFS_KEY)})||"{}").theme;document.documentElement.setAttribute("data-theme",t==="dark"||t==="system"?t:"light")}catch(e){}`;

/** Applies a theme chosen in Settings without a reload. */
export function applyTheme(theme: Theme | undefined): void {
  document.documentElement.setAttribute("data-theme", theme && THEMES.includes(theme) ? theme : DEFAULT_THEME);
}
