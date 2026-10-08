import type { CourseOutline as Outline } from "@/content/outline";
import styles from "./r1.module.css";

/**
 * The chapter map of a course with no topics yet: every chapter "Not started", and an honest
 * "Coming soon" instead of a row to open. Nothing here reads progress, so it renders on the server.
 */
export function CourseOutline({ outline }: { outline: Outline }) {
  return (
    <div className={styles.chapters}>
      {outline.chapters.map((chapter, i) => (
        <section key={chapter.id} className={styles.chapterBox} aria-labelledby={`${chapter.id}-h`}>
          <div className={styles.outlineHead}>
            <span className={styles.chapterNum} aria-hidden="true">
              {i + 1}
            </span>
            <span className={styles.chapterHead}>
              <h2 id={`${chapter.id}-h`} className={styles.chapterTitle}>
                <span className="sr-only">Chapter {i + 1}: </span>
                {chapter.title}
              </h2>
              <span className={styles.chapterStatus} data-state="new">
                <span className={styles.statusShape} data-state="new" aria-hidden="true" />
                Not started · Coming soon
              </span>
            </span>
          </div>
        </section>
      ))}
    </div>
  );
}
