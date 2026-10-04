import { z } from "zod";
import { BooleanParseError, MAX_VARIABLES, parseBool } from "@/content/boolean";

/**
 * Boolean expression entry (#219). The answer is graded by meaning: any expression for the same
 * function is right, as long as it has the asked `form` and at most `maxLiterals` literals.
 * The function is given by `target` (an expression) or by `minterms` (+ `dontCares`), over `vars`
 * (minterm 0 = all variables 0, first variable most significant).
 */
export const ExpressionSpec = z
  .object({
    kind: z.literal("expression"),
    /** The variables the student may use, in the order of the minterm numbering. */
    vars: z.array(z.string().min(1)).min(1).max(MAX_VARIABLES),
    target: z.string().min(1).optional(),
    minterms: z.array(z.number().int().min(0)).optional(),
    dontCares: z.array(z.number().int().min(0)).default([]),
    form: z.enum(["sop", "pos", "any"]).default("any"),
    /** Most literals a right answer may have (simplification questions). */
    maxLiterals: z.number().int().positive().optional(),
  })
  .superRefine((s, ctx) => {
    if ((s.target === undefined) === (s.minterms === undefined)) ctx.addIssue({ code: "custom", message: "give either target or minterms" });
    if (new Set(s.vars).size !== s.vars.length) ctx.addIssue({ code: "custom", message: "vars must be distinct" });
    const rows = 2 ** s.vars.length;
    for (const m of [...(s.minterms ?? []), ...s.dontCares]) if (m >= rows) ctx.addIssue({ code: "custom", message: `minterm ${m} is out of range for ${s.vars.length} variables` });
    if (s.minterms?.some((m) => s.dontCares.includes(m))) ctx.addIssue({ code: "custom", message: "a minterm cannot also be a don't-care" });
    if (s.target) {
      try {
        parseBool(s.target, { vars: s.vars });
      } catch (e) {
        ctx.addIssue({ code: "custom", message: `target: ${e instanceof BooleanParseError ? e.message : String(e)}` });
      }
    }
  });

export type ExpressionSpec = z.infer<typeof ExpressionSpec>;

/** How a wrong or not-yet-acceptable expression is recognised. */
export const expressionDetectors = [
  /** The text does not parse (or uses a variable the question does not have). */
  z.object({ type: z.literal("expression-unreadable") }),
  /** Same function, but not in the asked form (SOP / POS). */
  z.object({ type: z.literal("expression-wrong-form") }),
  /** Same function, but more literals than allowed: not simplified yet. */
  z.object({ type: z.literal("expression-not-simplified") }),
  /** The complement of the function (e.g. a De Morgan step left out). */
  z.object({ type: z.literal("expression-complement") }),
  /** The function with AND and OR exchanged. */
  z.object({ type: z.literal("expression-and-or-swapped") }),
] as const;
