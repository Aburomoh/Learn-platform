import { create as createQr } from "qrcode";
import styles from "./r1.module.css";

/** The public address the code opens (owner, #657). */
export const SHARE_URL = "https://cet-learn.vercel.app";
export const SHARE_HOST = "cet-learn.vercel.app";
/** Quiet zone around the symbol, in modules (the QR standard asks for 4). */
export const QUIET = 4;

/**
 * The QR symbol as one SVG path (dark modules only), computed once at build: this is a server
 * component in a static export, so no QR library reaches the browser and no service is called.
 * Error correction M; no logo overlay. `d` is a sequence of `M x y h1v1h-1z`, one per dark module
 * in module units, which the unit test reads back and decodes.
 */
export function qrPath(text: string): { size: number; d: string } {
  const code = createQr(text, { errorCorrectionLevel: "M" });
  const size = code.modules.size;
  const parts: string[] = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (code.modules.get(y, x)) parts.push(`M${x + QUIET} ${y + QUIET}h1v1h-1z`);
  return { size, d: parts.join("") };
}

/**
 * A quiet card at the foot of the landing page (#657): the QR code on a light tile (in dark mode
 * too), a short caption, and the address as a tappable link for the phone that cannot scan itself.
 * Secondary to the Start action above it; the page's tokens, radius and shadow.
 */
export function ShareCard() {
  const { size, d } = qrPath(SHARE_URL);
  const side = size + QUIET * 2;
  return (
    <section className={styles.share} aria-labelledby="share-h">
      <div className={styles.shareTile}>
        <svg viewBox={`0 0 ${side} ${side}`} className={styles.shareQr} role="img" aria-label={`QR code: opens ${SHARE_HOST}`} data-qr-size={size} shapeRendering="crispEdges">
          <path d={d} />
        </svg>
      </div>
      <div className={styles.shareText}>
        <h2 id="share-h" className={styles.shareTitle}>
          Scan to open CET Learn on your phone
        </h2>
        <p className={styles.shareLead}>Practise anywhere, no account needed. On a phone, tap the address instead.</p>
        <a href={SHARE_URL} className={styles.shareLink}>
          {SHARE_HOST}
        </a>
      </div>
    </section>
  );
}
