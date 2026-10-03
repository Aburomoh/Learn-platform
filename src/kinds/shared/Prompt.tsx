import { Notation } from "@/interactions/shared/Notation";
import styles from "./shared.module.css";

/** The question text above a kind's practice view, with base notation rendered. */
export function Prompt({ text }: { text: string }) {
  return (
    <p className={styles.prompt}>
      <Notation text={text} />
    </p>
  );
}
