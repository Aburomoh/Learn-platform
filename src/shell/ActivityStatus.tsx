"use client";

import { useOfferingProgress } from "@/learner";
import styles from "./Shell.module.css";

/** Small local-progress badge for an activity card (guest data from this browser only). */
export function ActivityStatus({ offeringId, activityId }: { offeringId: string; activityId: string }) {
  const [progress] = useOfferingProgress(offeringId);
  const a = progress.activities[activityId];
  if (!a || a.status === "new") return null;
  return (
    <span className={a.status === "completed" ? styles.statusDone : styles.statusStarted} data-testid={`status-${activityId}`}>
      {a.status === "completed" ? (a.independent ? "Completed, no hints" : "Completed") : "Started"}
    </span>
  );
}
