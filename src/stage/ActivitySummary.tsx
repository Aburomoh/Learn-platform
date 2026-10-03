import Link from "next/link";
import type { Activity } from "@/content/schema";
import styles from "./Stage.module.css";

export function ActivitySummary({ activity, attempts, hintsUsed, backHref, onRestart }: { activity: Activity; attempts: number; hintsUsed: number; backHref: string; onRestart: () => void }) {
  return (
    <section className={styles.stage} aria-label="Activity complete" data-testid="activity-summary">
      <h2>Activity complete</h2>
      <p>
        {activity.title}: {activity.questions.length} questions, {attempts} {attempts === 1 ? "attempt" : "attempts"},{" "}
        {hintsUsed === 0 ? "no hints needed" : `hints used on ${hintsUsed} ${hintsUsed === 1 ? "question" : "questions"}`}.
      </p>
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={onRestart}>
          Practise again
        </button>
        <Link href={backHref} className="btn btn-primary">
          Back to topic
        </Link>
      </div>
    </section>
  );
}
