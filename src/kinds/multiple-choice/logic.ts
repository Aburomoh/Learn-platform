import type { KindLogic } from "../types";
import type { MultipleChoiceSpec } from "./spec";

export type MultipleChoiceAnswer = { kind: "multiple-choice"; optionId: string };

export const multipleChoice: KindLogic<MultipleChoiceSpec, MultipleChoiceAnswer> = {
  grade(variant, answer) {
    const spec = variant.spec;
    const correct = answer.optionId === spec.correctOptionId;
    const option = spec.options.find((o) => o.id === answer.optionId);
    const fromDetector = variant.misconceptions.find((m) => m.detect.type === "option" && m.detect.optionId === answer.optionId)?.id;
    return { correct, normalized: answer.optionId, misconceptionId: correct ? undefined : (option?.misconceptionId ?? fromDetector) };
  },
};
