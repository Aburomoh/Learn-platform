"use client";

import { useCallback, useSyncExternalStore } from "react";
import { product } from "../../config/product";
import { keysWithPrefix, readJSON, removeKey, writeJSON } from "./storage";
import { emptyProgress, type OfferingProgress } from "./progress";

const PREFIX = product.storagePrefix;
const SAVE_DELAY_MS = 1000;

export const progressKey = (offeringId: string) => `${PREFIX}:progress:${offeringId}`;
export const PREFS_KEY = `${PREFIX}:prefs`;

export interface Prefs {
  /** Characters per second for the tutor bubble; 0 = instant. */
  typingSpeed: number;
  locale: "en" | "ar";
  /** Appearance; absent in records saved before the choice existed (treated as light). */
  theme?: "light" | "dark" | "system";
}

export const defaultPrefs: Prefs = { typingSpeed: 45, locale: "en", theme: "light" };

/* ---------- tiny external store with debounced persistence ---------- */
interface Store<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (cb: () => void) => () => void;
  flush: () => void;
}

function createStore<T>(key: string, initial: () => T, validate: (v: unknown) => v is T, delay: number): Store<T> {
  let value: T | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const load = () => {
    if (value === undefined) {
      const raw = readJSON<unknown>(key);
      value = validate(raw) ? raw : initial();
    }
    return value;
  };
  // global timer functions, not window.*: a pending save may fire after a test's jsdom is gone (#455)
  const flush = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    if (typeof window === "undefined") return;
    if (value !== undefined) writeJSON(key, value);
  };
  return {
    get: load,
    set: (next) => {
      const prev = load();
      value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      listeners.forEach((l) => l());
      if (typeof window === "undefined") return;
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    subscribe: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    flush,
  };
}

const progressStores = new Map<string, Store<OfferingProgress>>();

export function getProgressStore(offeringId: string): Store<OfferingProgress> {
  let s = progressStores.get(offeringId);
  if (!s) {
    s = createStore<OfferingProgress>(
      progressKey(offeringId),
      () => emptyProgress(offeringId),
      (v): v is OfferingProgress => !!v && typeof v === "object" && (v as OfferingProgress).version === 1 && (v as OfferingProgress).offeringId === offeringId,
      SAVE_DELAY_MS,
    );
    progressStores.set(offeringId, s);
  }
  return s;
}

const prefsStore = createStore<Prefs>(
  PREFS_KEY,
  () => defaultPrefs,
  (v): v is Prefs => !!v && typeof v === "object" && typeof (v as Prefs).typingSpeed === "number",
  200,
);

/** Write every pending save now and stop its timer (page hide; test teardown, #455). */
export function flushPendingWrites(): void {
  progressStores.forEach((s) => s.flush());
  prefsStore.flush();
}

// Persist pending writes when the page is hidden or unloaded.
if (typeof window !== "undefined") {
  const flushAll = flushPendingWrites;
  window.addEventListener("pagehide", flushAll);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAll();
  });
}

/* ---------- React hooks ---------- */
const serverSnapshots = new Map<string, OfferingProgress>();

/**
 * Snapshot used for the pre-rendered HTML and the first client render: empty progress.
 * useSyncExternalStore requires the same object on every call, so it is cached per offering.
 */
export function serverProgressSnapshot(offeringId: string): OfferingProgress {
  let snapshot = serverSnapshots.get(offeringId);
  if (!snapshot) {
    snapshot = emptyProgress(offeringId);
    serverSnapshots.set(offeringId, snapshot);
  }
  return snapshot;
}

export function useOfferingProgress(offeringId: string) {
  const store = getProgressStore(offeringId);
  const progress = useSyncExternalStore(store.subscribe, store.get, () => serverProgressSnapshot(offeringId));
  const update = useCallback((fn: (p: OfferingProgress) => OfferingProgress) => store.set(fn), [store]);
  return [progress, update] as const;
}

export function usePrefs() {
  const prefs = useSyncExternalStore(prefsStore.subscribe, prefsStore.get, () => defaultPrefs);
  const setPrefs = useCallback((patch: Partial<Prefs>) => prefsStore.set((p) => ({ ...p, ...patch })), []);
  return [prefs, setPrefs] as const;
}

/** Student-facing "clear my data": removes every key under the product prefix. */
export function clearLocalData(): number {
  const keys = keysWithPrefix(PREFIX + ":");
  keys.forEach(removeKey);
  progressStores.forEach((s, id) => s.set(emptyProgress(id)));
  prefsStore.set(defaultPrefs);
  return keys.length;
}

/** Test hook. */
export function _resetStores(): void {
  progressStores.clear();
}
