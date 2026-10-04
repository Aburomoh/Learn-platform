import { focusTarget } from "@/interactions/shared/types";
import styles from "./Stage.module.css";

/** Shows a binary string, optionally split into 4-bit groups with their hex digit. */
export function BitGroups({ bits, groups, attention, done }: { bits: string; groups: string[]; attention?: number; done?: boolean }) {
  if (groups.length === 0) {
    return (
      <p className={`${styles.bits} mono`} {...focusTarget("bits")}>
        {bits}
      </p>
    );
  }
  return (
    <div className={styles.groups} {...focusTarget("bits")}>
      {groups.map((g, i) => {
        const value = parseInt(g, 2);
        return (
          <div key={i} className={`${styles.group} ${attention === i ? styles.groupAttention : ""}`} {...focusTarget(`group-${i}`)}>
            <span className="mono">{g}</span>
            <span className={styles.groupValue}>{done ? <strong className="mono">{value.toString(16).toUpperCase()}</strong> : "?"}</span>
          </div>
        );
      })}
    </div>
  );
}
