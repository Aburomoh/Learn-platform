import Link from "next/link";
import type { Activity } from "@/content/schema";
import { Notation } from "@/interactions/shared/Notation";
import { PrimaryAction } from "@/shell/r1";
import type { PrimaryAction as NextAction } from "@/shell/primaryAction";
import styles from "./Stage.module.css";

export interface ActivitySummaryProps {
  activity: Activity;
  /** The topic's objectives, shown as a self-check now that the practice is done. */
  objectives: string[];
  attempts: number;
  hintsUsed: number;
  /** The same next action the topic page offers (Next topic, the next practice, or Review). */
  next: NextAction;
  topicHref: string;
  onRestart: () => void;
}

/**
 * End of a practice: what was done, the objectives as a "You can now" self-check, and one next
 * action (the page's only filled button), with quieter ways back.
 */
export function ActivitySummary({ activity, objectives, attempts, hintsUsed, next, topicHref, onRestart }: ActivitySummaryProps) {
  // Review of this same practice is offered as "Practise again", so it is not repeated as a link.
  const primary = next.kind === "review" ? { label: "Back to topic", href: topicHref } : next.primary;
  return (
    <section className={styles.stage} aria-label="Practice complete" data-testid="activity-summary">
      <h2 className={styles.summaryTitle}>Practice complete</h2>
      <p>
        {activity.title}: {activity.questions.length} challenges, {attempts} {attempts === 1 ? "attempt" : "attempts"},{" "}
        {hintsUsed === 0 ? "no hints needed" : `hints used on ${hintsUsed} ${hintsUsed === 1 ? "challenge" : "challenges"}`}.
      </p>
      {objectives.length > 0 && (
        <div>
          <p className={styles.summaryLead}>You can now:</p>
          <ul className={styles.summaryList}>
            {objectives.map((text) => (
              <li key={text}>
                <Notation text={text} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.summaryActions}>
        <PrimaryAction primary={primary} />
        <div className={styles.actions}>
          <button type="button" className="btn btn-quiet" onClick={onRestart}>
            Practise again
          </button>
          {next.kind !== "review" && (
            <Link href={topicHref} className="btn btn-quiet">
              Back to topic
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
