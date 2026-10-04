import { z } from "zod";
import { DivisionStep } from "../shared/contextSpec";

/**
 * Repeated division by 2, one checked step at a time (ECET 111 Chapter 1 layout: a row of
 * numbers, a row of remainders; first remainder = LSB, last = MSB). The question is complete
 * when the quotient reaches 0. A content test verifies the authored steps.
 */
export const RepeatedDivisionSpec = z.object({
  kind: z.literal("repeated-division"),
  value: z.number().int().positive(),
  base: z.literal(2),
  steps: z.array(DivisionStep).min(2).max(8),
});

export type RepeatedDivisionSpec = z.infer<typeof RepeatedDivisionSpec>;

export const repeatedDivisionDetectors = [
  /** Division step: quotient right but remainder wrong. */
  z.object({ type: z.literal("division-remainder") }),
  /** Division step: remainder right but quotient wrong. */
  z.object({ type: z.literal("division-quotient") }),
  /** Division step: quotient and remainder entered in each other's place. */
  z.object({ type: z.literal("division-swapped") }),
] as const;
