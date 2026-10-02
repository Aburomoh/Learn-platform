import Link from "next/link";
import { product } from "../../config/product";
import { courses } from "@/content";
import { Shell } from "@/shell/Shell";
import styles from "@/shell/Shell.module.css";

export default function Home() {
  return (
    <Shell>
      <h1>{product.name}</h1>
      <p className={styles.lead}>
        {product.tagline} for {product.owner.displayName}&apos;s CET courses. Practise with interactive activities and short,
        instructor-style guidance. No account needed.
      </p>
      <section className={styles.section} aria-labelledby="courses-h">
        <h2 id="courses-h">Courses</h2>
        <div className={styles.grid}>
          {courses.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}/`} className={styles.card}>
              <h3>{c.title}</h3>
              <p>{c.summary}</p>
              <div className={styles.meta}>
                <span>{c.code}</span>
                <span>{c.modules.reduce((n, m) => n + m.topics.length, 0)} topics</span>
                {c.authority === "DEMO" && <span className="demo-badge">DEMO</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Shell>
  );
}
