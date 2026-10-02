import { TopBar, type Crumb } from "./TopBar";
import styles from "./Shell.module.css";

/** Learning Shell page frame: top bar, content column, demo notice. */
export function Shell({ crumbs, wide = false, children }: { crumbs?: Crumb[]; wide?: boolean; children: React.ReactNode }) {
  return (
    <>
      <TopBar crumbs={crumbs} />
      <main className={wide ? styles.mainWide : styles.main}>{children}</main>
      <footer className={styles.footer}>
        <span className="demo-badge">DEMO / NOT AUTHORITATIVE COURSE CONTENT</span>
        <span>Optional practice. Not connected to grades. Progress stays in this browser.</span>
      </footer>
    </>
  );
}
