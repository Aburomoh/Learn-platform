import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { flushPendingWrites } from "@/learner/store";

afterEach(() => {
  // no debounced save may outlive the test's jsdom (#455)
  flushPendingWrites();
  cleanup();
  try {
    window.localStorage.clear();
  } catch {
    /* storage may be unavailable */
  }
});
