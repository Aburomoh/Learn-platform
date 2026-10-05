import styles from "./figures.module.css";

/** The numbers 1, 2, 3 over a figure's inputs, body and outputs: they tie a topic card's callouts to the picture (visual system §11). */
export function Marks({ xs, y }: { xs: [number, number, number]; y: number }) {
  return (
    <g aria-hidden="true">
      {xs.map((x, i) => (
        <g key={i} data-mark={i + 1}>
          <circle cx={x} cy={y} r="11" className={styles.mark} />
          <text x={x} y={y + 5} textAnchor="middle" className={styles.markText}>
            {i + 1}
          </text>
        </g>
      ))}
    </g>
  );
}
