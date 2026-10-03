"use client";

import { useHydrated } from "@/shell/useHydrated";
import { resumeMarkerScript } from "./resumeMarker";

/**
 * The pre-paint resume marker (see resumeMarker.ts) as an element. The script only matters in the
 * pre-rendered HTML, where the browser runs it before the stage paints. On a client-side
 * navigation React would create the tag without running it (and log an error), and the runner
 * starts on the right challenge anyway, so it is rendered on the server and during hydration only.
 */
export function ResumeScript({ offeringId, activityId }: { offeringId: string; activityId: string }) {
  const hydrated = useHydrated();
  if (hydrated) return null;
  return <script dangerouslySetInnerHTML={{ __html: resumeMarkerScript(offeringId, activityId) }} />;
}
