import { z } from "zod";
import { id } from "@/content/primitives";
import { BooleanParseError, MAX_VARIABLES, parseBool } from "@/content/boolean";

/**
 * The laws and rules a derivation line can name, as the deck names them (Chapter 2: laws p.37–40,
 * rules p.41–43, De Morgan p.55–63). Distributive covers both directions (multiply out, factor).
 */
export const LawId = z.enum([
  "commutative",
  "associative",
  "distributive",
  "or-0",
  "or-1",
  "or-not",
  "or-self",
  "and-not",
  "and-1",
  "and-0",
  "and-self",
  "double",
  "absorb",
  "absorb-not",
  "de-morgan",
]);
export type LawId = z.infer<typeof LawId>;

export const DerivationLine = z.object({
  /** The law that turns the previous line into this one. */
  law: LawId,
  /** The line itself, in course notation. */
  expr: z.string().min(1),
  /** The law chips offered (3–4, including `law`). */
  lawOptions: z.array(LawId).min(2).max(4),
  /** choose mode: wrong lines offered next to `expr`; each may name a misconception. */
  wrongLines: z.array(z.object({ id, expr: z.string().min(1), misconceptionId: id.optional() })).max(3).default([]),
});

/**
 * Derivation (#221): from `start`, each line is two goals: name the law, then give the line, by
 * choosing it (`lineMode: choose`) or typing it (`type`, graded by structure: term and factor order
 * do not matter, but a different expression does). A content test checks each line is equivalent
 * to the one before.
 */
export const DerivationSpec = z
  .object({
    kind: z.literal("derivation"),
    vars: z.array(z.string().min(1)).min(1).max(MAX_VARIABLES),
    start: z.string().min(1),
    lines: z.array(DerivationLine).min(1).max(8),
    lineMode: z.enum(["choose", "type"]).default("choose"),
  })
  .superRefine((d, ctx) => {
    const check = (label: string, text: string) => {
      try {
        parseBool(text, { vars: d.vars });
      } catch (e) {
        ctx.addIssue({ code: "custom", message: `${label}: ${e instanceof BooleanParseError ? e.message : String(e)}` });
      }
    };
    check("start", d.start);
    d.lines.forEach((l, i) => {
      check(`line ${i + 1}`, l.expr);
      l.wrongLines.forEach((w) => check(`line ${i + 1} option ${w.id}`, w.expr));
      if (!l.lawOptions.includes(l.law)) ctx.addIssue({ code: "custom", message: `line ${i + 1}: lawOptions must include ${l.law}` });
      if (d.lineMode === "choose" && !l.wrongLines.length) ctx.addIssue({ code: "custom", message: `line ${i + 1}: choose mode needs wrong lines` });
    });
  });

export type DerivationSpec = z.infer<typeof DerivationSpec>;
export type DerivationLine = z.infer<typeof DerivationLine>;

export const derivationDetectors = [
  /** Typed line: not the same function as the line before (an algebra slip). */
  z.object({ type: z.literal("line-not-equivalent") }),
  /** Typed line: still equivalent, but it jumps ahead to a later line (a step skipped). */
  z.object({ type: z.literal("line-skipped") }),
  /** Typed line: valid algebra (equivalent), but not the step this law gives here. */
  z.object({ type: z.literal("line-other") }),
] as const;
