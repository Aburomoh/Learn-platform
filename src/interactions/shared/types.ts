/**
 * Shared contract for Interaction Engine components (docs/INTERACTION_SYSTEM.md).
 * Components never grade; they emit answers on explicit submit and render whatever
 * feedback state the ActivityRunner passes back.
 */
export type AnswerState = "idle" | "correct" | "incorrect";

export interface InteractionBaseProps {
  /** Stable id; used for progress keys and `data-focus-target` names. */
  id: string;
  /** Locked after a correct answer or while an explanation is running. */
  disabled?: boolean;
  /** Visual state of the last submitted answer. */
  state?: AnswerState;
}

/** Elements the tutor can point at carry this attribute. */
export const FOCUS_ATTR = "data-focus-target";

export function focusTarget(id: string): Record<string, string> {
  return { [FOCUS_ATTR]: id };
}
