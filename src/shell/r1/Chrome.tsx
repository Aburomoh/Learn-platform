import Link from "next/link";
import type { ReactNode } from "react";
import { product } from "../../../config/product";
import { PrimaryAction, type ActionLink } from "./PrimaryAction";
import { ProfileMenu } from "./ProfileMenu";
import styles from "./r1.module.css";

/**
 * Top bar (R1 redesign §8): the mark and the product name (both from config), an optional quiet
 * "back" link, and the profile button. No breadcrumb trail; the page's eyebrow says where you are.
 */
export function TopBar({ back }: { back?: ActionLink }) {
  return (
    <header className={styles.bar}>
      <div className={styles.barInner}>
        <Link href="/" className={styles.brandLink} aria-label={`${product.name} home`}>
          {/* decorative: the name beside it is the label */}
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, tiny SVG, no optimisation wanted */}
          <img src={product.brand.markSrc} alt="" width={24} height={24} className={styles.mark} />
          <span>{product.name}</span>
        </Link>
        {back && (
          <Link href={back.href} className={styles.back}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.utilIcon}>
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            <span>{back.label}</span>
          </Link>
        )}
        <span className={styles.spacer} />
        <ProfileMenu />
      </div>
    </header>
  );
}

/**
 * Footer facts line (R1 redesign §8). The demo notice is a small amber dot with text, not a badge;
 * it shows whenever the content on the page is not instructor-approved.
 */
export function Footer({ demo }: { demo: boolean }) {
  return (
    <footer className={styles.foot}>
      {demo && <span className={styles.demoDot}>Demo content</span>}
      <span>Optional practice, not graded</span>
      <span>Progress stays in this browser</span>
    </footer>
  );
}

export interface TopicRowProps {
  title: string;
  /** Makes the title a quiet text link to the topic page. */
  href?: string;
  /** One line under the title, e.g. "Decimal → Binary → Octal → Hex". */
  route?: string;
  /** Status or effort line, e.g. "2 of 4 challenges done" or "3 short challenges · about 6 min". */
  status?: string;
  /** Muted, normal weight for an effort cue; the default (semibold) is for progress. */
  statusMuted?: boolean;
  /** True for a finished topic: the status gets a check mark as well as its text. */
  completed?: boolean;
  /** Small visual on the left (a `PreviewBoard size="sm"`, a gate glyph…); hidden on phones. */
  visual?: ReactNode;
  /** Keep the visual column even when this row has no visual, so titles line up down the list. */
  reserveVisual?: boolean;
  action: ActionLink;
  /** Filled button for the next topic to do; quiet text action for the rest. */
  emphasis?: "primary" | "quiet";
}

/**
 * One topic on the course page: a plain surface with a visual, the title and route, a status
 * line and one button. The row itself is never the click target.
 */
export function TopicRow({ title, href, route, status, statusMuted = false, completed = false, visual, reserveVisual = false, action, emphasis = "quiet" }: TopicRowProps) {
  return (
    <li className={styles.topicRow}>
      {(visual || reserveVisual) && (
        <div className={styles.topicVisual} aria-hidden={visual ? undefined : true}>
          {visual}
        </div>
      )}
      <div className={styles.topicText}>
        <h3 className={styles.topicTitle}>
          {href ? (
            <Link href={href} className={styles.titleLink}>
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        {route && <p className={styles.topicRoute}>{route}</p>}
        {status && (
          <p className={`${styles.topicStatus} ${completed ? styles.topicDone : statusMuted ? styles.statusMuted : ""}`}>
            {completed && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.check}>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
            {status}
          </p>
        )}
      </div>
      <div className={styles.topicAction}>
        {emphasis === "primary" ? (
          <PrimaryAction primary={action} size="row" />
        ) : (
          <Link href={action.href} className={styles.quiet} aria-label={`${action.label}: ${title}`}>
            {action.label} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </li>
  );
}
