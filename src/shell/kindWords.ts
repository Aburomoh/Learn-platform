import type { Activity } from "@/content/schema";
import { hasMessage, resolveMessage } from "@/tutor/messages";

/**
 * A practice's kind in plain words (owner refinement 1, epic #670): what the student will do,
 * from the kinds of its questions in order, each once ("Step-by-step division · Group the bits").
 * The words are catalogue strings (`ui.kind.<kind>`), so the Arabic batch covers them; a kind
 * without words falls back to its id, never to nothing.
 */
export function kindsOf(activity: Activity): string[] {
  const seen: string[] = [];
  for (const q of activity.questions) {
    const kind = q.variants[0]?.spec.kind;
    if (kind && !seen.includes(kind)) seen.push(kind);
  }
  return seen;
}

export function kindWords(activity: Activity): string {
  return kindsOf(activity)
    .map((kind) => (hasMessage(`ui.kind.${kind}`) ? resolveMessage(`ui.kind.${kind}`) : kind))
    .join(" · ");
}
