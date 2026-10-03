import { splitNotation } from "@/content/notation";
import styles from "./r1.module.css";

export interface PreviewTile {
  value: string;
  /** Number base written as a subscript in the content string, if any. */
  base?: string;
}

/** Splits a content preview such as "53_10 → 110101_2 → 65_8 → 35_16" into tiles. */
export function parsePreview(preview: string): PreviewTile[] {
  return preview
    .split("→")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [token] = splitNotation(part);
      return token && !("text" in token) && token.raw === part ? { value: token.value, base: token.base } : { value: part };
    });
}

/**
 * The learning preview (R1 redesign §3): a sunken board of tactile tiles showing the topic's worked
 * chain. One image to assistive technology, read out in words. The numbers come from the topic's
 * `preview` in content and never from the practice itself.
 */
export function PreviewBoard({ preview, size = "lg", bare = false }: { preview: string; size?: "lg" | "sm"; /** Tiles only, without the sunken board (inside a topic row). */ bare?: boolean }) {
  const tiles = parsePreview(preview);
  const label = tiles.map((t) => (t.base ? `${t.value} base ${t.base}` : t.value)).join(", then ");
  return (
    <div className={`${bare ? styles.bare : styles.board} ${size === "sm" ? styles.boardSm : ""}`}>
      <div className={styles.chain} role="img" aria-label={label}>
        {tiles.map((t, i) => (
          <span key={i} className={styles.chainItem}>
            {i > 0 && <span className={styles.arrow}>→</span>}
            <span className={`${styles.tile} mono`}>
              {t.value}
              {t.base && <sub>{t.base}</sub>}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
