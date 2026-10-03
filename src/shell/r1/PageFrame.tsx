import type { ReactNode } from "react";
import { Footer, TopBar } from "./Chrome";
import type { ActionLink } from "./PrimaryAction";
import styles from "./r1.module.css";

export interface PageFrameProps {
  /** Quiet link in the top bar to the level above. */
  back?: ActionLink;
  /** True when the content on the page is not instructor-approved (shows the demo notice). */
  demo: boolean;
  /** Right column on wide screens (the tutor); hidden below 900 px. */
  aside?: ReactNode;
  children: ReactNode;
}

/**
 * Frame of a redesigned page: top bar, a readable main column (content max 1120 px with an
 * optional 320 px right column), and the footer facts line. Nothing stretches to fill the screen.
 */
export function PageFrame({ back, demo, aside, children }: PageFrameProps) {
  return (
    <>
      <TopBar back={back} />
      <main className={styles.main}>
        <div className={aside ? styles.split : undefined}>
          <div className={styles.column}>{children}</div>
          {aside && <div className={styles.aside}>{aside}</div>}
        </div>
      </main>
      <Footer demo={demo} />
    </>
  );
}
