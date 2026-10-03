import styles from "./r1.module.css";

const SUBSCRIPTS: Record<string, string> = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };

export interface PreviewTile {
  value: string;
  /** Number base written as a subscript in the content string, if any. */
  base?: string;
}

/** Splits a content preview such as "53₁₀ → 110101₂ → 65₈ → 35₁₆" into tiles. */
export function parsePreview(preview: string): PreviewTile[] {
  return preview
    .split("→")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^(.*?)([₀-₉]+)$/);
      if (!m) return { value: part };
      return { value: m[1].trim(), base: [...m[2]].map((c) => SUBSCRIPTS[c]).join("") };
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
