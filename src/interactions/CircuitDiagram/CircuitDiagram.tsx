"use client";

import { useMemo } from "react";
import type { CircuitSpec } from "@/content/schema";
import { evaluateCircuit } from "@/content/grade";
import { focusTarget } from "../shared/types";
import { GATE_H, INPUT_H, INPUT_W, gateWidth, layoutCircuit } from "./layout";
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
  /** Gate currently being asked about; drawn with an accent outline (distinct from `lit`). */
  activeGateId?: string;
  /** Show the output value on the final gate. */
  revealOutput?: boolean;
  disabled?: boolean;
}

/** Smallest rendered scale: keeps 14px labels at 12px or more; narrower screens scroll sideways. */
const MIN_SCALE = 0.88;

/**
 * Small SVG circuit (up to 3 inputs, 4 gates) drawn like a textbook schematic: standard gate
 * symbols, one pin per gate input and right-angle wires (see layout.ts). Inputs are hotspots
 * (role="switch") when toggleable; gates carry data-focus-target="gate-<id>" so hints can
 * point at them.
 */
export function CircuitDiagram({ id, spec, inputs, onToggleInput, lit = [], activeGateId, revealOutput = false, disabled = false }: CircuitDiagramProps) {
  const values = evaluateCircuit(spec, inputs);
  const layout = useMemo(() => layoutCircuit(spec), [spec]);
  const { viewBox, output } = layout;
  const toggleable = spec.inputsToggleable && !!onToggleInput && !disabled;

  return (
    <div className={styles.root} data-diagram={id}>
      <svg viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} className={styles.svg} style={{ maxWidth: viewBox.width, minWidth: Math.round(viewBox.width * MIN_SCALE) }} role="img" aria-labelledby={`${id}-title`}>
        <title id={`${id}-title`}>Circuit with {spec.gates.map((g) => g.type).join(", ")} gates</title>
        {/* wires */}
        {layout.wires.map((w, i) => {
          const on = lit.includes(w.to) || lit.includes(w.from) ? values[w.from] === 1 : false;
          return (
            <g key={`${w.from}-${w.to}-${i}`} data-wire={`${w.from}-${w.to}`}>
              <path d={w.points.map((p, k) => `${k ? "L" : "M"} ${p.x} ${p.y}`).join(" ")} className={`${styles.wire} ${on ? styles.wireOn : ""}`} />
              {w.junction && <circle cx={w.junction.x} cy={w.junction.y} r="3.5" className={`${styles.junction} ${on ? styles.junctionOn : ""}`} />}
            </g>
          );
        })}
        {/* output stub */}
        <path d={`M ${output.from.x} ${output.from.y} L ${output.to.x} ${output.to.y}`} className={`${styles.wire} ${revealOutput && values[spec.outputGateId] === 1 ? styles.wireOn : ""}`} />
        <text x={output.to.x + 8} y={output.to.y + 5} className={styles.label}>
          Y{revealOutput ? ` = ${values[spec.outputGateId]}` : ""}
        </text>

        {/* inputs */}
        {spec.inputs.map((inp) => {
          const p = layout.inputs[inp.id];
          const v = values[inp.id];
          const common = { className: `${styles.input} ${v === 1 ? styles.inputOn : ""} ${toggleable ? styles.toggleable : ""}` };
          return (
            <g
              key={inp.id}
              transform={`translate(${p.x - INPUT_W / 2}, ${p.y - INPUT_H / 2})`}
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
              <rect width={INPUT_W} height={INPUT_H} rx="8" className={styles.inputBox} />
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
          const p = layout.gates[g.id];
          const isLit = lit.includes(g.id);
          return (
            <g key={g.id} transform={`translate(${p.x}, ${p.y - GATE_H / 2})`} className={`${styles.gate} ${isLit ? styles.gateLit : ""} ${g.id === activeGateId ? styles.gateActive : ""}`} data-active={g.id === activeGateId || undefined} {...focusTarget(`gate-${g.id}`)}>
              <GateShape type={g.type} />
              <text x={g.type === "NOT" ? 20 : g.type === "AND" || g.type === "NAND" ? 27 : 31} y={g.type === "NOT" ? 58 : 27} textAnchor="middle" className={styles.gateLabel}>
                {g.type}
              </text>
              {isLit && (
                <text x={gateWidth(g.type) + 6} y="14" className={`${styles.value} mono`}>
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
          <path d="M 0 2 L 40 22 L 0 42 Z" className={styles.body} />
          <circle cx="44" cy="22" r="4" className={styles.body} />
        </>
      );
    case "AND":
    case "NAND":
      return (
        <>
          <path d="M 0 0 H 34 A 22 22 0 0 1 34 44 H 0 Z" className={styles.body} />
          {type === "NAND" && <circle cx="60" cy="22" r="4" className={styles.body} />}
        </>
      );
    case "OR":
    case "NOR":
    case "XOR":
      return (
        <>
          {type === "XOR" && <path d="M -7 0 Q 5 22 -7 44" className={styles.backArc} />}
          <path d="M 0 0 Q 12 22 0 44 Q 36 44 60 22 Q 36 0 0 0 Z" className={styles.body} />
          {type === "NOR" && <circle cx="64" cy="22" r="4" className={styles.body} />}
        </>
      );
  }
}
