import Link from "next/link";
import { product } from "../../config/product";
import styles from "./TopBar.module.css";

export interface Crumb {
  href: string;
  label: string;
}

export function TopBar({ crumbs = [] }: { crumbs?: Crumb[] }) {
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label={`${product.name} home`}>
          {product.name}
        </Link>
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className={styles.crumbs}>
            <ol>
              {crumbs.map((c, i) => (
                <li key={c.href}>
                  {i < crumbs.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <Link href="/settings/" className={styles.guest} title="Guest: progress is saved only in this browser. Open settings.">
          Guest · Settings
        </Link>
      </div>
    </header>
  );
}
