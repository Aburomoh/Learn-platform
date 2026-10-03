/**
 * Offering-scoped learner progress (docs/LEARNER_MODEL.md). Pure functions over a plain object.
 * No ability labels, ever. Recent evidence outweighs old evidence.
 */
export type ActivityStatus = "new" | "started" | "completed";

export interface MasteryEvidence {
  questionId: string;
  correct: boolean;
  /** Hints used before this answer (0 = independent). */
  hintsUsed: number;
  misconceptionId?: string;
  at: number;
}

export interface ActivityProgress {
  status: ActivityStatus;
  attempts: number;
  hintsUsed: number;
  /** Completed with no hints on the final variant. */
  independent: boolean;
  lastAt: number;
  /** Question ids finished in this practice (R1, #117). Optional: older stored data has none. */
  completedQuestions?: string[];
}

export interface OfferingProgress {
  version: 1;
  offeringId: string;
  activities: Record<string, ActivityProgress>;
  concepts: Record<string, { evidence: MasteryEvidence[] }>;
}

export const EVIDENCE_CAP = 20;
const DECAY = 0.8;

export function emptyProgress(offeringId: string): OfferingProgress {
  return { version: 1, offeringId, activities: {}, concepts: {} };
}

export function startActivity(p: OfferingProgress, activityId: string, now = Date.now()): OfferingProgress {
  const a = p.activities[activityId];
  if (a && a.status !== "new") return p;
  return {
    ...p,
    activities: { ...p.activities, [activityId]: { status: "started", attempts: 0, hintsUsed: 0, independent: false, lastAt: now } },
  };
}

export interface AttemptInput {
  activityId: string;
  questionId: string;
  conceptId: string;
  correct: boolean;
  hintsUsed: number;
  misconceptionId?: string;
}

export function recordAttempt(p: OfferingProgress, input: AttemptInput, now = Date.now()): OfferingProgress {
  const prev = p.activities[input.activityId] ?? { status: "started" as const, attempts: 0, hintsUsed: 0, independent: false, lastAt: now };
  const activity: ActivityProgress = {
    ...prev,
    status: prev.status === "completed" ? "completed" : "started",
    attempts: prev.attempts + 1,
    hintsUsed: Math.max(prev.hintsUsed, input.hintsUsed),
    lastAt: now,
  };
  const ev: MasteryEvidence = { questionId: input.questionId, correct: input.correct, hintsUsed: input.hintsUsed, misconceptionId: input.misconceptionId, at: now };
  const list = [...(p.concepts[input.conceptId]?.evidence ?? []), ev].slice(-EVIDENCE_CAP);
  return {
    ...p,
    activities: { ...p.activities, [input.activityId]: activity },
    concepts: { ...p.concepts, [input.conceptId]: { evidence: list } },
  };
}

export function completeActivity(p: OfferingProgress, activityId: string, independent: boolean, now = Date.now()): OfferingProgress {
  const prev = p.activities[activityId] ?? { status: "started" as const, attempts: 0, hintsUsed: 0, independent: false, lastAt: now };
  return { ...p, activities: { ...p.activities, [activityId]: { ...prev, status: "completed", independent: prev.independent || independent, lastAt: now } } };
}

/** Records a finished question (challenge). Idempotent; never removes entries, so Review keeps them. */
export function completeQuestion(p: OfferingProgress, activityId: string, questionId: string, now = Date.now()): OfferingProgress {
  const prev = p.activities[activityId] ?? { status: "started" as const, attempts: 0, hintsUsed: 0, independent: false, lastAt: now };
  const done = prev.completedQuestions ?? [];
  if (done.includes(questionId)) return p;
  const status = prev.status === "completed" ? "completed" : "started";
  return { ...p, activities: { ...p.activities, [activityId]: { ...prev, status, completedQuestions: [...done, questionId], lastAt: now } } };
}

/**
 * Index of the first question not yet finished, in activity order: where Continue resumes.
 * 0 with no record; null when every question is finished (the caller offers Review / Next topic).
 */
export function firstUnfinishedQuestion(activity: { questions: { id: string }[] }, progress?: ActivityProgress): number | null {
  const done = new Set(progress?.completedQuestions ?? []);
  const i = activity.questions.findIndex((q) => !done.has(q.id));
  return i < 0 ? null : i;
}

/**
 * Recent-weighted mastery estimate in [0, 1]. Independent correct answers count fully,
 * hinted ones partially. Returns null with no evidence (unknown, not "weak").
 */
export function masteryEstimate(evidence: MasteryEvidence[]): number | null {
  if (evidence.length === 0) return null;
  let num = 0;
  let den = 0;
  for (let i = 0; i < evidence.length; i++) {
    const w = DECAY ** (evidence.length - 1 - i);
    const e = evidence[i];
    const score = e.correct ? (e.hintsUsed === 0 ? 1 : 0.6) : 0;
    num += w * score;
    den += w;
  }
  return den ? num / den : null;
}

export function recentMisconceptions(evidence: MasteryEvidence[], limit = 3): string[] {
  const ids: string[] = [];
  for (let i = evidence.length - 1; i >= 0 && ids.length < limit; i--) {
    const m = evidence[i].misconceptionId;
    if (m && !ids.includes(m)) ids.push(m);
  }
  return ids;
}
