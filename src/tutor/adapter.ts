/**
 * ConversationalTutorAdapter (docs/TUTOR_ENGINE.md, ADR-0003).
 * Version 1 uses RuleBasedTutor only. LocalModelTutor and CommercialTutor are declared as
 * kinds so call sites can be written against the interface, but no implementation exists and
 * none may decide course truth; any future adapter may only choose among approved messages.
 */
import type { LearningEvent } from "./engine/events";
import type { TutorAction } from "./engine/actions";
import type { ActivityContext, TutorState } from "./engine/state";
import { reduce } from "./engine/reduce";

export interface TutorTurnInput {
  state: TutorState;
  event: LearningEvent;
  ctx: ActivityContext;
}

export interface TutorTurnOutput {
  state: TutorState;
  actions: TutorAction[];
}

export interface ConversationalTutorAdapter {
  readonly kind: TutorAdapterKind;
  respond(input: TutorTurnInput): Promise<TutorTurnOutput>;
}

export type TutorAdapterKind = "rule-based" | "local-model" | "commercial";

export class RuleBasedTutor implements ConversationalTutorAdapter {
  readonly kind = "rule-based" as const;
  async respond({ state, event, ctx }: TutorTurnInput): Promise<TutorTurnOutput> {
    return reduce(state, event, ctx);
  }
}

export function createTutorAdapter(kind: TutorAdapterKind = "rule-based"): ConversationalTutorAdapter {
  if (kind !== "rule-based") {
    throw new Error(`Tutor adapter "${kind}" is not implemented in v1 (ADR-0003).`);
  }
  return new RuleBasedTutor();
}
