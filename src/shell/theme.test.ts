import { afterEach, describe, expect, it } from "vitest";
import { PREFS_KEY } from "@/learner";
import { THEME_PREFS_KEY, applyTheme, themeScript } from "./theme";

const run = () => new Function(themeScript)();
const theme = () => document.documentElement.getAttribute("data-theme");

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("theme script (inline in <head>)", () => {
  it("reads the same key the prefs store writes", () => {
    expect(THEME_PREFS_KEY).toBe(PREFS_KEY);
    expect(themeScript).toContain(JSON.stringify(PREFS_KEY));
  });

  it("is light by default, with no prefs or an old record without a theme", () => {
    run();
    expect(theme()).toBe("light");
    localStorage.setItem(PREFS_KEY, JSON.stringify({ typingSpeed: 45, locale: "en" }));
    run();
    expect(theme()).toBe("light");
  });

  it("applies a stored dark or match-device choice, and nothing else", () => {
    for (const t of ["dark", "system"]) {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ typingSpeed: 45, theme: t }));
      run();
      expect(theme()).toBe(t);
    }
    localStorage.setItem(PREFS_KEY, JSON.stringify({ theme: "<script>" }));
    run();
    expect(theme()).toBe("light");
  });

  it("never throws on unreadable storage and stays within its remit (no network, no other DOM access)", () => {
    localStorage.setItem(PREFS_KEY, "{not json");
    expect(run).not.toThrow();
    expect(themeScript).not.toMatch(/fetch|XMLHttpRequest|import|cookie|src=|innerHTML|eval/);
    expect(themeScript.length).toBeLessThan(260);
  });

  it("applyTheme sets the attribute and falls back to light", () => {
    applyTheme("dark");
    expect(theme()).toBe("dark");
    applyTheme(undefined);
    expect(theme()).toBe("light");
  });
});
