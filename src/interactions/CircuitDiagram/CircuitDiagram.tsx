"use client";

import type { CircuitSpec } from "@/content/schema";
import { evaluateCircuit } from "@/content/grade";
import { focusTarget } from "../shared/types";
import styles from "./CircuitDiagram.module.css";

export interface CircuitDiagramProps {
  id: string;
  spec: CircuitSpec;
  /** Current input values (defaults to the spec's). */
  inputs?: Record<string, 0 | 1>;
  /** When given and spec.inputsToggleable, inputs become toggle switches. */
  onToggleInput?: (inputId: string, value: 0 | 1) => void;
  /** Gate ids whose evaluated value is shown (explanation mode). */
  lit?: string[];
  /** Show the output value on the final gate. */
  revealOutput?: boolean;
  disabled?: boolean;
}

const COL_W = 120;
const ROW_H = 64;

/**
 * Small SVG circuit (up to 3 inputs, 4 gates). Inputs are hotspots (role="switch") when
 * toggleable; gates carry data-focus-target="gate-<id>" so hints can point at them.
 */
export function CircuitDiagram({ id, spec, inputs, onToggleInput, lit = [], revealOutput = false, disabled = false }: CircuitDiagramProps) {
  const values = evaluateCircuit(spec, inputs);
  const depth = gateDepths(spec);
  const maxDepth = Math.max(...Object.values(depth));
  const width = (maxDepth + 2) * COL_W + 40;
  const rows = Math.max(spec.inputs.length, spec.gates.length);
  const height = rows * ROW_H + 24;

  const pos: Record<string, { x: number; y: number }> = {};
  spec.inputs.forEach((inp, i) => (pos[inp.id] = { x: 30, y: 32 + i * ROW_H }));
  const byDepth: Record<number, string[]> = {};
  for (const g of spec.gates) (byDepth[depth[g.id]] ??= []).push(g.id);
  for (const [d, ids] of Object.entries(byDepth)) {
    ids.forEach((gid, i) => {
      const g = spec.gates.find((x) => x.id === gid)!;
      const srcY = g.from.map((f) => pos[f]?.y ?? 32 + i * ROW_H);
      const y = srcY.reduce((a, b) => a + b, 0) / srcY.length;
      pos[gid] = { x: 30 + (Number(d) + 1) * COL_W, y };
    });
  }
  const outPos = pos[spec.outputGateId];
  const toggleable = spec.inputsToggleable && !!onToggleInput && !disabled;

  return (
    <div className={styles.root} data-diagram={id}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg} role="img" aria-labelledby={`${id}-title`}>
        <title id={`${id}-title`}>Circuit with {spec.gates.map((g) => g.type).join(", ")} gates</title>
        {/* wires */}
        {spec.gates.map((g) =>
          g.from.map((f) => {
            const a = pos[f];
            const b = pos[g.id];
            const on = lit.includes(g.id) || lit.includes(f) ? values[f] === 1 : false;
            return <path key={`${f}-${g.id}`} d={`M ${a.x + 28} ${a.y} C ${a.x + 70} ${a.y}, ${b.x - 70} ${b.y}, ${b.x - 32} ${b.y}`} className={`${styles.wire} ${on ? styles.wireOn : ""}`} />;
          }),
        )}
        {/* output stub */}
        <path d={`M ${outPos.x + 30} ${outPos.y} h 40`} className={`${styles.wire} ${revealOutput && values[spec.outputGateId] === 1 ? styles.wireOn : ""}`} />
        <text x={outPos.x + 76} y={outPos.y + 5} className={styles.label}>
          Y{revealOutput ? ` = ${values[spec.outputGateId]}` : ""}
        </text>

        {/* inputs */}
        {spec.inputs.map((inp) => {
          const p = pos[inp.id];
          const v = values[inp.id];
          const common = { className: `${styles.input} ${v === 1 ? styles.inputOn : ""} ${toggleable ? styles.toggleable : ""}` };
          return (
            <g
              key={inp.id}
              transform={`translate(${p.x - 20}, ${p.y - 20})`}
              {...common}
              {...(toggleable
                ? {
                    role: "switch",
                    tabIndex: 0,
                    "aria-checked": v === 1,
                    "aria-label": `Input ${inp.label}, currently ${v}`,
                    onClick: () => onToggleInput?.(inp.id, v === 1 ? 0 : 1),
                    onKeyDown: (e: React.KeyboardEvent) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        onToggleInput?.(inp.id, v === 1 ? 0 : 1);
                      }
                    },
                  }
                : { "aria-hidden": true })}
              {...focusTarget(`input-${inp.id}`)}
            >
              <rect width="44" height="40" rx="8" className={styles.inputBox} />
              <text x="12" y="25" className={styles.label}>
                {inp.label}
              </text>
              <text x="30" y="25" className={`${styles.value} mono`}>
                {v}
              </text>
            </g>
          );
        })}

        {/* gates */}
        {spec.gates.map((g) => {
          const p = pos[g.id];
          const isLit = lit.includes(g.id);
          return (
            <g key={g.id} transform={`translate(${p.x - 30}, ${p.y - 22})`} className={`${styles.gate} ${isLit ? styles.gateLit : ""}`} {...focusTarget(`gate-${g.id}`)}>
              <GateShape type={g.type} />
              <text x={g.type === "NOT" ? 22 : 30} y={g.type === "NOT" ? 58 : 27} textAnchor="middle" className={styles.gateLabel}>
                {g.type}
              </text>
              {isLit && (
                <text x="62" y="-4" className={`${styles.value} mono`}>
                  {values[g.id]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function GateShape({ type }: { type: CircuitSpec["gates"][number]["type"] }) {
  switch (type) {
    case "NOT":
      return (
        <>
          <path d="M 4 2 L 48 22 L 4 42 Z" className={styles.body} />
          <circle cx="53" cy="22" r="4" className={styles.body} />
        </>
      );
    case "AND":
    case "NAND":
      return (
        <>
          <path d="M 4 2 H 34 A 20 20 0 0 1 34 42 H 4 Z" className={styles.body} />
          {type === "NAND" && <circle cx="58" cy="22" r="4" className={styles.body} />}
        </>
      );
    case "OR":
    case "NOR":
    case "XOR":
      return (
        <>
          {type === "XOR" && <path d="M -2 2 Q 10 22 -2 42" className={styles.body} fill="none" />}
          <path d="M 4 2 Q 16 22 4 42 Q 34 42 56 22 Q 34 2 4 2 Z" className={styles.body} />
          {type === "NOR" && <circle cx="60" cy="22" r="4" className={styles.body} />}
        </>
      );
  }
}

function gateDepths(spec: CircuitSpec): Record<string, number> {
  const depth: Record<string, number> = {};
  const inputIds = new Set(spec.inputs.map((i) => i.id));
  const resolve = (gid: string, guard = 0): number => {
    if (depth[gid] !== undefined) return depth[gid];
    if (guard > 20) throw new Error("Circuit cycle");
    const g = spec.gates.find((x) => x.id === gid)!;
    const d = Math.max(...g.from.map((f) => (inputIds.has(f) ? -1 : resolve(f, guard + 1)))) + 1;
    depth[gid] = d;
    return d;
  };
  for (const g of spec.gates) resolve(g.id);
  return depth;
}
