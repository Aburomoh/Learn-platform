"use client";

/**
 * The Arabic supportive-text maps (ADR-0011 §2–3): `{english template → arabic template}` per course
 * plus `shared` (tutor catalog and component text), generated at build by scripts/build-l10n.mjs
 * under /l10n/ar/ and fetched only while the learner's language is Arabic. A lookup is by the exact
 * English template, before the slots are filled; a miss falls back to the English. Module memory
 * caches each map for the page's life; a small external store re-renders subscribers when one lands.
 */
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { usePrefs } from "@/learner";

export const SHARED = "shared";
const BASE = "/l10n/ar/";

const maps = new Map<string, Record<string, string>>();
const loading = new Set<string>();
const failed = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;
let index: Promise<Record<string, string> | null> | null = null;

function notify() {
  version += 1;
  listeners.forEach((l) => l());
}

function readIndex(): Promise<Record<string, string> | null> {
  // the index has a stable name and is revalidated every time; the maps it names are content-hashed
  index ??= fetch(`${BASE}index.json`, { cache: "no-cache" })
    .then((r) => (r.ok ? (r.json() as Promise<Record<string, string>>) : null))
    .catch(() => null);
  return index;
}

/** Starts loading one map (idempotent). Resolves when it is in memory, or when it is known to be missing. */
export async function loadArabic(name: string): Promise<void> {
  if (maps.has(name) || loading.has(name) || failed.has(name) || typeof fetch === "undefined") return;
  loading.add(name);
  try {
    const idx = await readIndex();
    const file = idx?.[name];
    if (!file) throw new Error(`no Arabic map for ${name}`);
    const r = await fetch(`${BASE}${file}`);
    if (!r.ok) throw new Error(String(r.status));
    const data = (await r.json()) as Record<string, string>;
    maps.set(name, data);
  } catch {
    failed.add(name); // English fallback for this page's life; the next page load tries again
  } finally {
    loading.delete(name);
    notify();
  }
}

/** The Arabic for an English template, from the course map then the shared one; undefined when absent. */
export function arabicFor(english: string, course?: string): string | undefined {
  return (course ? maps.get(course)?.[english] : undefined) ?? maps.get(SHARED)?.[english];
}

export function hasArabicMap(name: string): boolean {
  return maps.has(name);
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getVersion = () => version;
const serverVersion = () => 0;

/**
 * The learner's language and, with Arabic on, the maps for `course`: it starts the loads and
 * re-renders when they arrive. Returns a translate function for the current state.
 */
export function useArabic(course?: string): { locale: "en" | "ar"; translate: (english: string) => string } {
  const [prefs] = usePrefs();
  const locale = prefs.locale === "ar" ? "ar" : "en";
  useSyncExternalStore(subscribe, getVersion, serverVersion);
  useEffect(() => {
    if (locale !== "ar") return;
    void loadArabic(SHARED);
    if (course) void loadArabic(course);
  }, [locale, course]);
  const translate = useCallback((english: string) => (locale === "ar" ? (arabicFor(english, course) ?? english) : english), [locale, course]);
  return { locale, translate };
}

/** Test hook: puts a map in memory (or removes it) without a network. */
export function _setArabicMap(name: string, data: Record<string, string> | null): void {
  if (data) maps.set(name, data);
  else maps.delete(name);
  failed.delete(name);
  notify();
}

/** Test hook: forgets every map and pending load. */
export function _resetArabic(): void {
  maps.clear();
  loading.clear();
  failed.clear();
  index = null;
  notify();
}
