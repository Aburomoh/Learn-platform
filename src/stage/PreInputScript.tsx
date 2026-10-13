"use client";

import { useHydrated } from "@/shell/useHydrated";
import { preInputScript } from "./preHydration";

/**
 * The pre-hydration input recorder (see preHydration.ts) as an element, placed before the stage
 * so it runs before the pre-rendered controls can be touched. Like `ResumeScript`, it only
 * matters in the pre-rendered HTML: on a client-side navigation React would create the tag
 * without running it, and there is no pre-hydration window anyway.
 */
export function PreInputScript() {
  const hydrated = useHydrated();
  if (hydrated) return null;
  return <script dangerouslySetInnerHTML={{ __html: preInputScript }} />;
}
