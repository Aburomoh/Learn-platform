/**
 * Content schema (ADR-0002). Humans author TypeScript modules typed by these schemas; a test
 * validates every module. Deliberately not over-normalised: a question embeds its hints,
 * explanation steps and variants so an author can read one object top to bottom.
 */
import { z } from "zod";
import { GateType } from "@/kinds/circuit-predict/spec";
import { FigureSpec, figurePins } from "@/kinds/shared/figures/figureSpec";
import { kindDetectors, kindSpecs } from "@/kinds/specs";
import { id, template } from "./primitives";

export { GateType };
// Kind specs live with their kinds (ADR-0008); re-exported so content keeps one import path.
export { BitGroupingSpec } from "@/kinds/bit-grouping/spec";
export { CircuitSpec } from "@/kinds/circuit-predict/spec";
export { ColumnAdditionSpec } from "@/kinds/column-addition/spec";
export { MultipleChoiceSpec } from "@/kinds/multiple-choice/spec";
export { NumericSpec } from "@/kinds/numeric/spec";
export { PlaceValueSpec } from "@/kinds/place-value/spec";
export { RepeatedDivisionSpec } from "@/kinds/repeated-division/spec";
export { DivisionStep, NumericContext } from "@/kinds/shared/contextSpec";

export const Authority = z.enum(["DEMO", "APPROVED"]);

export const ConceptSchema = z.object({
  id,
  title: z.string(),
  summary: template,
});

export const LearningObjectiveSchema = z.object({
  id,
  conceptId: id,
  text: z.string(),
});

/** Hint rungs follow the scaffold ladder in docs/PEDAGOGY.md (1 = independent retry, 9 = full). */
export const HintRung = z.union([
  z.literal(2), z.literal(3), z.literal(4), z.literal(5),
  z.literal(6), z.literal(7), z.literal(8), z.literal(9),
]);
export const HintSchema = z.object({
  rung: HintRung,
  text: template,
  /** data-focus-target id on the stage to FOCUS when this hint is shown. */
  focus: z.string().optional(),
  /** data-focus-target id to HIGHLIGHT (rung 5+ visual hints). */
  highlight: z.string().optional(),
});

/** One Explain Slowly step: one idea, optional visual change, optional prediction question. */
export const ExplanationStepSchema = z.object({
  id,
  say: template,
  /**
   * Kind-specific stage state applied when the step is shown (e.g. lit place values), plus the two
   * keys of the question's figure (ADR-0009): the pin with the halo, and whether the result is drawn.
   */
  stage: z
    .object({ figureFocus: z.string().min(1).optional(), figureResult: z.boolean().optional() })
    .catchall(z.unknown())
    .optional(),
  ask: z
    .object({
      prompt: template,
      options: z.array(z.string()).min(2).max(4),
      correctIndex: z.number().int().min(0),
      afterCorrect: template.optional(),
      afterWrong: template.optional(),
    })
    .optional(),
});

/**
 * How a wrong answer is recognised as a known misconception. `equals` works for every kind; the
 * others belong to their kind (`src/kinds/<kind>/spec.ts`, collected in `kindDetectors`).
 */
export const MisconceptionDetector = z.discriminatedUnion("type", [
  z.object({ type: z.literal("equals"), value: z.union([z.string(), z.number()]) }),
  ...kindDetectors,
]);

export const MisconceptionSchema = z.object({
  id,
  title: z.string(),
  /** Message key in the tutor catalog (activity-scoped keys allowed). */
  nudgeKey: z.string(),
  detect: MisconceptionDetector,
});

/* ---------- Interaction specs: one per kind, from the registry (`src/kinds/specs.ts`, ADR-0008) ---------- */
export const InteractionSpec = z.discriminatedUnion("kind", kindSpecs);

/** A concrete instance of a question. The first variant is primary; others are retry variations. */
export const VariantSchema = z.object({
  id,
  prompt: template,
  spec: InteractionSpec,
  /** The device or circuit the question is about, drawn by the stage for any kind (ADR-0009). */
  figure: FigureSpec.optional(),
  /** Values for `{name}` slots in templates (hints, steps, messages). */
  vars: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
  hints: z.array(HintSchema).min(1),
  /** Per-step ladders keyed by `stepTag` (ADR-0007 §3); `hints` is the fallback. Use `hintsForStep`. */
  hintsByStep: z.record(z.string(), z.array(HintSchema).min(1)).optional(),
  explanation: z.array(ExplanationStepSchema).min(2),
  misconceptions: z.array(MisconceptionSchema).default([]),
  /** Optional overrides for generic tutor reactions (message text, not keys). */
  reactions: z
    .object({
      correct: template.optional(),
      correctAfterHints: template.optional(),
      /** Said after each correct intermediate step (repeated-division, circuit-predict); may use step vars. */
      stepNext: template.optional(),
    })
    .optional(),
})
  .superRefine((v, ctx) => {
    // the figure (ADR-0009): a kind that draws the device itself takes none, and a step's focus must be one of its pins
    if (v.figure && v.spec.kind === "device") ctx.addIssue({ code: "custom", path: ["figure"], message: "a device question draws its own block: no figure" });
    const pins = v.figure ? figurePins(v.figure) : [];
    v.explanation.forEach((step, i) => {
      const { figureFocus, figureResult } = step.stage ?? {};
      if (!v.figure && (figureFocus !== undefined || figureResult !== undefined)) ctx.addIssue({ code: "custom", path: ["explanation", i, "stage"], message: "figureFocus / figureResult need a figure on the variant" });
      else if (figureFocus !== undefined && !pins.includes(figureFocus)) ctx.addIssue({ code: "custom", path: ["explanation", i, "stage", "figureFocus"], message: `"${figureFocus}" is not a pin of the figure (${pins.join(", ")})` });
    });
  });

export const QuestionSchema = z.object({
  id,
  /** Short challenge name for progress dots and the topic's "Today" line (R1, #110). */
  label: z.string().min(1).max(24).optional(),
  conceptId: id,
  objectiveId: id,
  variants: z.array(VariantSchema).min(1),
});

export const ActivitySchema = z.object({
  id,
  title: z.string(),
  summary: z.string(),
  authority: Authority,
  /** Estimated minutes, shown to the student. */
  minutes: z.number().int().positive(),
  questions: z.array(QuestionSchema).min(1),
});

export const TopicSchema = z.object({
  id,
  title: z.string(),
  summary: z.string(),
  /** Visual preview on the topic page, e.g. a worked conversion chain. Never uses the activity's own numbers. */
  preview: z.string().min(1).optional(),
  /**
   * The topic's "meet it" card (visual system §11): the device's symbol with one worked case, drawn in
   * its result state, and exactly three callouts (what comes in, what the device does, what comes out).
   * Shown on the topic page in place of the preview tiles.
   */
  meet: z.object({ figure: FigureSpec, callouts: z.array(template).length(3) }).optional(),
  concepts: z.array(ConceptSchema).min(1),
  objectives: z.array(LearningObjectiveSchema).min(1),
  prerequisites: z.array(id).default([]),
  activities: z.array(ActivitySchema).min(1),
});

export const ModuleSchema = z
  .object({
    id,
    title: z.string(),
    /** A planned chapter with no topics yet; shown as "coming soon". Every other chapter has at least one topic. */
    comingSoon: z.boolean().optional(),
    topics: z.array(TopicSchema),
  })
  .refine((m) => m.comingSoon === true || m.topics.length > 0, { message: "a chapter needs a topic, or comingSoon: true", path: ["topics"] })
  .refine((m) => !m.comingSoon || m.topics.length === 0, { message: "a comingSoon chapter has no topics", path: ["topics"] });

export const CourseSchema = z.object({
  id,
  code: z.string(),
  title: z.string(),
  summary: z.string(),
  authority: Authority,
  /** Learner progress is scoped to this id (docs/LEARNER_MODEL.md). */
  offeringId: id,
  modules: z.array(ModuleSchema).min(1),
});

export type Concept = z.infer<typeof ConceptSchema>;
export type LearningObjective = z.infer<typeof LearningObjectiveSchema>;
export type Hint = z.infer<typeof HintSchema>;
export type ExplanationStep = z.infer<typeof ExplanationStepSchema>;
export type Misconception = z.infer<typeof MisconceptionSchema>;
export type InteractionSpec = z.infer<typeof InteractionSpec>;
export type Variant = z.infer<typeof VariantSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Course = z.infer<typeof CourseSchema>;

/** Input type (before defaults) for authoring modules. */
export type CourseInput = z.input<typeof CourseSchema>;
export type ModuleInput = z.input<typeof ModuleSchema>;
export type VariantInput = z.input<typeof VariantSchema>;
