import { z } from "zod";
import { id, template } from "@/content/primitives";
import { NumericContext } from "../shared/contextSpec";

export const MultipleChoiceSpec = z.object({
  kind: z.literal("multiple-choice"),
  options: z.array(z.object({ id, text: template, misconceptionId: id.optional() })).min(2).max(5),
  correctOptionId: id,
  /** Optional worked result shown above the options (same contexts as numeric questions). */
  context: NumericContext.optional(),
});

export type MultipleChoiceSpec = z.infer<typeof MultipleChoiceSpec>;

export const multipleChoiceDetectors = [
  /** The student picked this option. */
  z.object({ type: z.literal("option"), optionId: id }),
] as const;
