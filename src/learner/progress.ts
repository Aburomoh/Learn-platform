/**
 * Offering-scoped learner progress (docs/LEARNER_MODEL.md). Pure functions over a plain object.
 * No ability labels, ever. Recent evidence outweighs old evidence.
 */
/** `skipped` (#579): a practice left through the first hidden skip; kept so stored records still read. Since #623 the skip records the question (`skippedQuestions`), never the practice. */
export type ActivityStatus = "new" | "started" | "completed" | "skipped";

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
  /** Explain Slowly was opened in this practice (#579 skip gate). Optional: older stored data has none. Local only. */
  explained?: boolean;
  /** Question ids left through the hidden skip (#623): unfinished, so the practice never completes until they are done. Local only. */
  skippedQuestions?: string[];
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

/**
 * ADR-0013: opening a practice is not progress, so the runner no longer calls this on mount. The
 * record is created by the first meaningful writer (`recordAttempt`, `completeQuestion`). Kept for
 * tests and stored data; a `started` record with no attempt and no done question reads as `new`
 * everywhere (`inProgress`).
 */
export function startActivity(p: OfferingProgress, activityId: string, now = Date.now()): OfferingProgress {
  const a = p.activities[activityId];
  // coming back to a skipped practice starts it again (its finished challenges are kept)
  if (a?.status === "skipped") return { ...p, activities: { ...p.activities, [activityId]: { ...a, status: "started", lastAt: now } } };
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

/**
 * Explain Slowly was opened: remembered on the record (#579). Not meaningful progress (ADR-0013,
 * owner refinement 3): `lastAt` is left as it was, and a record created here reads as `new`.
 */
export function markExplained(p: OfferingProgress, activityId: string): OfferingProgress {
  const prev = p.activities[activityId] ?? { status: "started" as const, attempts: 0, hintsUsed: 0, independent: false, lastAt: 0 };
  if (prev.explained) return p;
  return { ...p, activities: { ...p.activities, [activityId]: { ...prev, explained: true } } };
}

/**
 * The hidden skip (#623): the question is recorded as skipped; the practice stays unfinished (never
 * completed by a skip). A skip is not meaningful progress (ADR-0013): `lastAt` is left as it was.
 */
export function skipQuestion(p: OfferingProgress, activityId: string, questionId: string): OfferingProgress {
  const prev = p.activities[activityId] ?? { status: "started" as const, attempts: 0, hintsUsed: 0, independent: false, lastAt: 0 };
  if (prev.completedQuestions?.includes(questionId) || prev.skippedQuestions?.includes(questionId)) return p;
  const status = prev.status === "completed" ? "completed" : "started";
  return { ...p, activities: { ...p.activities, [activityId]: { ...prev, status, skippedQuestions: [...(prev.skippedQuestions ?? []), questionId] } } };
}

/**
 * The one test for "in progress" (ADR-0013 rule 8), used by every reader of `started`: a `started`
 * record with meaningful progress, an attempt or a done question. A visited-only or explained-only
 * record (`started`, no attempt, nothing done: the shape older builds wrote on mount) reads as `new`.
 */
export function inProgress(a: ActivityProgress | undefined): boolean {
  return !!a && a.status === "started" && (a.attempts > 0 || (a.completedQuestions?.length ?? 0) > 0);
}

/** Meaningful progress of any kind: in progress or completed. What "returning" and "started" mean on the course rows. */
export function hasProgress(a: ActivityProgress | undefined): boolean {
  return !!a && (a.status === "completed" || inProgress(a));
}

/**
 * A practice the student skipped ahead in (#623), or one left by the first skip (#579). With the
 * practice given, only its live questions count: a retired id in the stored list gives no badge (§6.1).
 */
export function skippedAhead(a: ActivityProgress | undefined, activity?: EffectiveActivity): boolean {
  if (!a || a.status === "completed") return false;
  if (a.status === "skipped") return true;
  return activity ? effectiveDone(activity, a).skipped.size > 0 : (a.skippedQuestions?.length ?? 0) > 0;
}

/** The first hidden skip (#579): the practices left behind become `skipped`; a completed one is untouched. Kept for stored data; no longer written (#623). */
export function skipActivities(p: OfferingProgress, activityIds: string[], now = Date.now()): OfferingProgress {
  const activities = { ...p.activities };
  for (const id of activityIds) {
    const prev = activities[id] ?? { status: "new" as const, attempts: 0, hintsUsed: 0, independent: false, lastAt: now };
    if (prev.status === "completed") continue;
    activities[id] = { ...prev, status: "skipped", lastAt: now };
  }
  return { ...p, activities };
}

/** Records a finished question (challenge). Idempotent; never removes entries, so Review keeps them. */
export function completeQuestion(p: OfferingProgress, activityId: string, questionId: string, now = Date.now()): OfferingProgress {
  const prev = p.activities[activityId] ?? { status: "started" as const, attempts: 0, hintsUsed: 0, independent: false, lastAt: now };
  const done = prev.completedQuestions ?? [];
  if (done.includes(questionId)) return p;
  const status = prev.status === "completed" ? "completed" : "started";
  // a skipped question, once done, is no longer skipped
  const skippedQuestions = prev.skippedQuestions?.filter((id) => id !== questionId);
  return { ...p, activities: { ...p.activities, [activityId]: { ...prev, status, completedQuestions: [...done, questionId], ...(skippedQuestions ? { skippedQuestions } : {}), lastAt: now } } };
}

/**
 * Index of the first question not yet finished, in activity order: where Continue resumes.
 * 0 with no record; null when every question is finished (the caller offers Review / Next topic).
 */
export function firstUnfinishedQuestion(activity: EffectiveActivity, progress?: ActivityProgress): number | null {
  const { completed } = effectiveDone(activity, progress);
  const i = activity.questions.findIndex((q) => !completed.has(q.id));
  return i < 0 ? null : i;
}

/** What `effectiveDone` needs of a practice: its live questions, each with the ids it is credited by. */
export interface EffectiveActivity {
  questions: { id: string; creditedBy?: readonly string[] }[];
}

/**
 * The one reader of a practice's stored progress (learning architecture §6.1, #692). Stored lists are
 * never rewritten, so unknown (retired) ids stay in them; every reader goes through here.
 * - `completed`: live question ids that are done, directly or by `creditedBy` (a stored completion of a listed id).
 * - `skipped`: live question ids skipped and not done. A retired id gives no credit and no badge.
 */
export function effectiveDone(activity: EffectiveActivity, record?: Pick<ActivityProgress, "completedQuestions" | "skippedQuestions">): { completed: Set<string>; skipped: Set<string> } {
  const stored = new Set(record?.completedQuestions ?? []);
  const skippedStored = new Set(record?.skippedQuestions ?? []);
  const completed = new Set<string>();
  const skipped = new Set<string>();
  for (const q of activity.questions) {
    if (stored.has(q.id) || (q.creditedBy ?? []).some((id) => stored.has(id))) completed.add(q.id);
    else if (skippedStored.has(q.id)) skipped.add(q.id);
  }
  return { completed, skipped };
}

/**
 * The practice's status as readers see it: a stored `completed` stays completed when the practice gains
 * questions (§6.1 rule 4); a started one whose live questions are all done, by credit or not, reads
 * completed until the next write (rule 6). The stored record is never changed.
 */
export function effectiveStatus(activity: EffectiveActivity, record?: Pick<ActivityProgress, "status" | "completedQuestions" | "skippedQuestions">): ActivityStatus {
  if (!record) return "new";
  if (record.status === "completed") return "completed";
  if (record.status !== "new" && activity.questions.length > 0 && effectiveDone(activity, record).completed.size === activity.questions.length) return "completed";
  return record.status;
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
