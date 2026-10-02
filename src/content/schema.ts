/**
 * Content schema (ADR-0002). Humans author TypeScript modules typed by these schemas; a test
 * validates every module. Deliberately not over-normalised: a question embeds its hints,
 * explanation steps and variants so an author can read one object top to bottom.
 */
import { z } from "zod";

export const Authority = z.enum(["DEMO", "APPROVED"]);

const id = z.string().regex(/^[a-z0-9][a-z0-9.-]*$/, "ids are lowercase, dot/dash separated");

/** Template text: `{name}` slots are filled from the variant's `vars`. */
const template = z.string().min(1);

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
  /** Kind-specific stage state applied when the step is shown (e.g. lit place values). */
  stage: z.record(z.string(), z.unknown()).optional(),
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

/** How a wrong answer is recognised as a known misconception. */
export const MisconceptionDetector = z.discriminatedUnion("type", [
  z.object({ type: z.literal("equals"), value: z.union([z.string(), z.number()]) }),
  z.object({ type: z.literal("reversed-bits") }),
  z.object({ type: z.literal("missing-place"), place: z.number().int().positive() }),
  z.object({ type: z.literal("extra-place"), place: z.number().int().positive() }),
  z.object({ type: z.literal("option"), optionId: id }),
]);

export const MisconceptionSchema = z.object({
  id,
  title: z.string(),
  /** Message key in the tutor catalog (activity-scoped keys allowed). */
  nudgeKey: z.string(),
  detect: MisconceptionDetector,
});

/* ---------- Interaction specs (kind-specific, deterministic truth) ---------- */

/** Place value bits: the student fills a row of place-value slots to represent `value` in `base`. */
export const PlaceValueSpec = z.object({
  kind: z.literal("place-value"),
  value: z.number().int().min(0),
  base: z.literal(2),
  /** Number of slots shown, most significant first. */
  slots: z.number().int().min(2).max(8),
  /** Correct answer: digits most-significant first, length === slots. */
  answer: z.array(z.union([z.literal(0), z.literal(1)])),
});

/** Numeric entry in a given base. */
export const NumericSpec = z.object({
  kind: z.literal("numeric"),
  base: z.union([z.literal(2), z.literal(8), z.literal(10), z.literal(16)]),
  /** Correct answer as digits in `base`, uppercase for hex. */
  answer: z.string().min(1),
});

export const MultipleChoiceSpec = z.object({
  kind: z.literal("multiple-choice"),
  options: z.array(z.object({ id, text: template, misconceptionId: id.optional() })).min(2).max(5),
  correctOptionId: id,
});

export const GateType = z.enum(["AND", "OR", "NOT", "XOR", "NAND", "NOR"]);
export const CircuitSpec = z.object({
  kind: z.literal("circuit-predict"),
  inputs: z.array(z.object({ id, label: z.string(), value: z.union([z.literal(0), z.literal(1)]) })).min(1).max(3),
  gates: z
    .array(z.object({ id, type: GateType, from: z.array(z.string()).min(1).max(2), label: z.string().optional() }))
    .min(1)
    .max(4),
  outputGateId: id,
  /** Authored output; a content test asserts it equals the evaluated circuit. */
  answer: z.union([z.literal(0), z.literal(1)]),
  /** Whether the student may toggle inputs on the diagram before answering. */
  inputsToggleable: z.boolean().default(false),
});

export const InteractionSpec = z.discriminatedUnion("kind", [PlaceValueSpec, NumericSpec, MultipleChoiceSpec, CircuitSpec]);

/** A concrete instance of a question. The first variant is primary; others are retry variations. */
export const VariantSchema = z.object({
  id,
  prompt: template,
  spec: InteractionSpec,
  /** Values for `{name}` slots in templates (hints, steps, messages). */
  vars: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
  hints: z.array(HintSchema).min(1),
  explanation: z.array(ExplanationStepSchema).min(2),
  misconceptions: z.array(MisconceptionSchema).default([]),
  /** Optional overrides for generic tutor reactions (message text, not keys). */
  reactions: z.object({ correct: template.optional(), correctAfterHints: template.optional() }).optional(),
});

export const QuestionSchema = z.object({
  id,
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
  concepts: z.array(ConceptSchema).min(1),
  objectives: z.array(LearningObjectiveSchema).min(1),
  prerequisites: z.array(id).default([]),
  activities: z.array(ActivitySchema).min(1),
});

export const ModuleSchema = z.object({
  id,
  title: z.string(),
  topics: z.array(TopicSchema).min(1),
});

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
export type PlaceValueSpec = z.infer<typeof PlaceValueSpec>;
export type NumericSpec = z.infer<typeof NumericSpec>;
export type MultipleChoiceSpec = z.infer<typeof MultipleChoiceSpec>;
export type CircuitSpec = z.infer<typeof CircuitSpec>;
export type InteractionSpec = z.infer<typeof InteractionSpec>;
export type Variant = z.infer<typeof VariantSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Course = z.infer<typeof CourseSchema>;

/** Input type (before defaults) for authoring modules. */
export type CourseInput = z.input<typeof CourseSchema>;
