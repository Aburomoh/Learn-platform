/**
 * Pre-paint marker for a returning student (#158). The activity page is pre-rendered with
 * challenge 1, so a new student sees the question at first paint. A student who is part-way
 * through would see challenge 1 flash before the runner resumes, so this tiny inline script, placed
 * just before the stage, sets `data-resume` on <html> when this practice has finished challenges
 * in local progress; CSS keeps the pre-rendered stage invisible until the runner has resumed and
 * removes the marker.
 *
 * Same rules as the theme script: it reads one storage key and sets one attribute, fails silently,
 * and makes no request. `<ResumeScript>` puts it in the pre-rendered page only.
 */
import { product } from "../../config/product";

export const RESUME_ATTR = "data-resume";

/** Same key as `progressKey(offeringId)` in src/learner/store.ts (a client module). */
export const resumeProgressKey = (offeringId: string) => `${product.storagePrefix}:progress:${offeringId}`;

export function resumeMarkerScript(offeringId: string, activityId: string): string {
  const key = JSON.stringify(resumeProgressKey(offeringId));
  const id = JSON.stringify(activityId);
  return `try{var a=(JSON.parse(localStorage.getItem(${key})||"{}").activities||{})[${id}];if(a&&(a.status==="started"||a.status==="skipped")&&(a.completedQuestions||[]).length&&!/[?&]review(=|&|$)/.test(location.search))document.documentElement.setAttribute("${RESUME_ATTR}","")}catch(e){}`;
}
