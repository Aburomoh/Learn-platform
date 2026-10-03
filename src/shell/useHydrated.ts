"use client";

import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * False while rendering on the server and during hydration, true on every later (client) render.
 * Local progress is only readable in the browser, so anything that depends on it is shown once
 * this is true; the pre-rendered version stays invisible, and nothing flashes from the first-visit
 * state to the returning one.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noSubscription, () => true, () => false);
}
