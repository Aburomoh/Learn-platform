import { product } from "../../config/product";

export default function Home() {
  return (
    <main style={{ maxWidth: "var(--content-max)", margin: "0 auto", padding: "var(--space-6) var(--space-4)" }}>
      <h1>{product.name}</h1>
      <p>{product.tagline}. Course list arrives with the first vertical slice.</p>
      <span className="demo-badge">DEMO / NOT AUTHORITATIVE COURSE CONTENT</span>
    </main>
  );
}
