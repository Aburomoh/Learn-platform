import { z } from "zod";
import { id } from "@/content/primitives";
import { BooleanParseError, parseBool } from "@/content/boolean";

/** A table cell: 0, 1, or X (don't-care / unused state, Chapters 4–5). */
export const Cell = z.union([z.literal(0), z.literal(1), z.literal("X")]);

/**
 * One column after the inputs. Its truth is computed from `expr` (course notation over the
 * table's inputs) or, where an expression cannot say it (don't-cares, excitation tables), given
 * as `values`, one per row in binary order.
 */
export const TableColumn = z
  .object({
    id,
    /** Header as on the slide: "A′", "AB′", "F", "Q⁺". */
    label: z.string().min(1),
    expr: z.string().min(1).optional(),
    values: z.array(Cell).optional(),
    /** Shown already filled: a column the student reads but does not write. */
    given: z.boolean().default(false),
    /** Two-level header for state tables: "Present state", "Next state", "Flip-flop inputs"… */
    group: z.string().optional(),
  })
  .refine((c) => (c.expr === undefined) !== (c.values === undefined), "a column has either expr or values");

/**
 * Truth table (#217): inputs on the left in ascending binary order, then the columns in order.
 * `fill` asks one column per goal (optionally the input columns first); `row-select` asks which
 * rows make the `target` column 1, in one goal; `mux-pairs` (#308, function with a MUX) asks, per
 * pair of rows that share the select bits, what that data input gets: 0, 1, v or v′, where v is
 * the last input (the data variable). One goal per pair.
 */
export const TruthTableSpec = z
  .object({
    kind: z.literal("truth-table"),
    /** Input variables, most significant first: row r has the bits of r. 1–4 inputs. */
    inputs: z.array(z.string().min(1)).min(1).max(4),
    columns: z.array(TableColumn).min(1).max(10),
    mode: z.enum(["fill", "row-select", "mux-pairs"]).default("fill"),
    /** row-select: the column whose 1-rows are picked; mux-pairs: the function F. */
    target: id.optional(),
    /** fill: the student also writes the input columns first (row order is then checked). */
    fillInputs: z.boolean().default(false),
    /** Where the m0…m15 column sits, if shown (decoder tables put it first, canonical forms last). */
    mintermColumn: z.enum(["left", "right"]).optional(),
  })
  .superRefine((t, ctx) => {
    const rows = 2 ** t.inputs.length;
    if (new Set(t.inputs).size !== t.inputs.length) ctx.addIssue({ code: "custom", message: "inputs must be distinct" });
    const ids = t.columns.map((c) => c.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "column ids must be distinct" });
    for (const c of t.columns) {
      if (c.values && c.values.length !== rows) ctx.addIssue({ code: "custom", message: `column ${c.id} needs ${rows} values` });
      if (c.expr) {
        try {
          parseBool(c.expr, { vars: t.inputs });
        } catch (e) {
          ctx.addIssue({ code: "custom", message: `column ${c.id}: ${e instanceof BooleanParseError ? e.message : String(e)}` });
        }
      }
    }
    if (t.mode === "row-select" || t.mode === "mux-pairs") {
      if (!t.target || !ids.includes(t.target)) ctx.addIssue({ code: "custom", message: `${t.mode} needs a target column` });
      if (t.fillInputs) ctx.addIssue({ code: "custom", message: `${t.mode} does not fill inputs` });
      if (t.mode === "mux-pairs" && t.inputs.length < 2) ctx.addIssue({ code: "custom", message: "mux-pairs needs a select input and a data input" });
      if (t.mode === "mux-pairs" && t.columns.find((c) => c.id === t.target)?.values?.includes("X")) ctx.addIssue({ code: "custom", message: "mux-pairs: no don't-cares in F" });
    } else if (!t.fillInputs && t.columns.every((c) => c.given)) {
      ctx.addIssue({ code: "custom", message: "fill mode needs at least one column to fill" });
    }
  });

export type TruthTableSpec = z.infer<typeof TruthTableSpec>;
export type TableColumn = z.infer<typeof TableColumn>;
export type Cell = z.infer<typeof Cell>;

/** How a wrong column or row choice is recognised (besides the shared detectors). */
export const truthTableDetectors = [
  /** The column matches the expression with AND and OR exchanged. */
  z.object({ type: z.literal("and-or-swapped") }),
  /** The column matches the expression with every complement left out (NAND written as AND…). */
  z.object({ type: z.literal("not-missing") }),
  /** Input columns hold every combination but not in ascending binary order. */
  z.object({ type: z.literal("rows-out-of-order") }),
  /** row-select: the 0-rows were picked instead of the 1-rows. */
  z.object({ type: z.literal("rows-inverted") }),
  /** mux-pairs: v and v′ exchanged. */
  z.object({ type: z.literal("pair-complement-swapped") }),
  /** mux-pairs: 0 or 1 where the pair follows the data variable (one row's value copied). */
  z.object({ type: z.literal("pair-constant-for-variable") }),
  /** mux-pairs: v or v′ where both rows agree (the input is a constant). */
  z.object({ type: z.literal("pair-variable-for-constant") }),
] as const;
