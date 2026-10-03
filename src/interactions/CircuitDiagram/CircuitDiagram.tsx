"use client";

import { useEffect, useMemo, useRef } from "react";
import type { CircuitSpec } from "@/content/schema";
import { evaluateCircuit } from "@/content/grade";
import { focusTarget } from "../shared/types";
import { useScrollFade } from "../shared/useScrollFade";
import { GATE_H, INPUT_H, INPUT_W, gateWidth, layoutCircuit } from "./layout";
import styles from "./CircuitDiagram.module.css";

export interface CircuitDiagramProps {
  id: string;
  spec: CircuitSpec;
  /** Current input values (defaults to the spec's). */
  inputs?: Record<string, 0 | 1>;
  /** When given and spec.inputsToggleable, inputs become toggle switches. */
  onToggleInput?: (inputId: string, value: 0 | 1) => void;
  /** Gate ids already answered or explained: their value is shown and their output wire is coloured. */
  lit?: string[];
  /**
   * Gate currently being asked about: halo, accent outline, `?` at its output and the values on
   * its input wires. Its output and everything after it stay neutral so nothing gives the answer away.
   */
  activeGateId?: string;
  /** Show the output value on the final gate. */
  revealOutput?: boolean;
  disabled?: boolean;
}

/**
 * Smallest rendered scale. All diagram text is 16 units or more, so at 0.75x it is still 12 px:
 * the layout is compact enough for a three-column circuit to fit a 390 px phone at that scale.
 * Narrower than that, the box scrolls sideways instead of shrinking the text.
 */
const MIN_SCALE = 0.75;

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
  const inputIds = new Set(spec.inputs.map((i) => i.id));
  /** A signal's value is known when it is a given input or its gate has been answered. */
  const isKnown = (id: string) => inputIds.has(id) || lit.includes(id);
  /** During a gate walk, parts not reached yet are dimmed. */
  const walking = activeGateId !== undefined;

  // On narrow screens the diagram scrolls sideways: keep the gate being asked in view.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    const gate = activeGateId ? root?.querySelector(`[data-focus-target="gate-${CSS.escape(activeGateId)}"]`) : null;
    if (!root || !gate || root.scrollWidth <= root.clientWidth) return;
    const g = gate.getBoundingClientRect();
    const r = root.getBoundingClientRect();
    root.scrollLeft += g.left + g.width / 2 - (r.left + r.width / 2);
  }, [activeGateId]);

  // Fade the edge(s) where more of the diagram is hidden, so sideways scrolling is discoverable.
  const fade = useScrollFade(rootRef);

  return (
    <div className={styles.root} data-diagram={id} data-fade={fade} ref={rootRef} {...(fade === "none" ? {} : { tabIndex: 0, role: "group", "aria-label": "Circuit diagram, scrolls sideways" })}>
      <svg viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} className={styles.svg} style={{ maxWidth: viewBox.width, minWidth: Math.round(viewBox.width * MIN_SCALE) }} role="img" aria-labelledby={`${id}-title`}>
        {/* One string child: React hydrates <title> text as a single node. */}
        <title id={`${id}-title`}>{`Circuit with ${spec.gates.map((g) => g.type).join(", ")} gates`}</title>
        {/* wires: a signal is coloured only once its value is known and its gate has been reached */}
        {layout.wires.map((w, i) => {
          const shown = isKnown(w.from) && (lit.includes(w.to) || lit.includes(w.from) || w.to === activeGateId);
          const pending = walking && !shown;
          const pin = w.points[w.points.length - 1];
          return (
            <g key={`${w.from}-${w.to}-${i}`} data-wire={`${w.from}-${w.to}`} data-signal={shown ? values[w.from] : undefined} className={pending ? styles.pending : undefined}>
              <path d={w.points.map((p, k) => `${k ? "L" : "M"} ${p.x} ${p.y}`).join(" ")} className={`${styles.wire} ${shown ? (values[w.from] === 1 ? styles.wireHigh : styles.wireLow) : ""}`} />
              {w.junction && <circle cx={w.junction.x} cy={w.junction.y} r="3.5" className={`${styles.junction} ${shown && values[w.from] === 1 ? styles.junctionHigh : ""}`} />}
              {w.to === activeGateId && (
                <text x={pin.x - 6} y={pin.y - 5} textAnchor="end" className={`${styles.pinValue} ${values[w.from] === 1 ? styles.valueHigh : styles.valueLow} mono`}>
                  {values[w.from]}
                </text>
              )}
            </g>
          );
        })}
        {/* output stub */}
        <g className={walking && !revealOutput ? styles.pending : undefined} data-wire="output" data-signal={revealOutput ? values[spec.outputGateId] : undefined}>
          <path d={`M ${output.from.x} ${output.from.y} L ${output.to.x} ${output.to.y}`} className={`${styles.wire} ${revealOutput ? (values[spec.outputGateId] === 1 ? styles.wireHigh : styles.wireLow) : ""}`} />
          <text x={output.to.x + 8} y={output.to.y + 5} className={styles.label}>
            Y{revealOutput ? ` = ${values[spec.outputGateId]}` : ""}
          </text>
        </g>

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
              {toggleable && <rect x="-12" y="-12" width={INPUT_W + 24} height={INPUT_H + 24} className={styles.hitArea} />}
              <rect width={INPUT_W} height={INPUT_H} rx="8" className={styles.inputBox} />
              <text x="7" y="26" className={styles.label}>
                {inp.label}
              </text>
              <text x="23" y="26" className={`${styles.value} ${v === 1 ? styles.valueHigh : styles.valueLow} mono`}>
                {v}
              </text>
            </g>
          );
        })}

        {/* gates */}
        {spec.gates.map((g) => {
          const p = layout.gates[g.id];
          const isLit = lit.includes(g.id);
          const isActive = g.id === activeGateId;
          const w = gateWidth(g.type);
          return (
            <g
              key={g.id}
              transform={`translate(${p.x}, ${p.y - GATE_H / 2})`}
              className={`${styles.gate} ${isActive ? styles.gateActive : ""} ${walking && !isLit && !isActive ? styles.pending : ""}`}
              data-active={isActive || undefined}
              {...focusTarget(`gate-${g.id}`)}
            >
              {isActive && <rect x="-10" y="-8" width={w + 20} height={GATE_H + 16} rx="10" className={styles.halo} />}
              <GateShape type={g.type} />
              <text x={g.type === "NOT" ? 20 : g.type === "AND" || g.type === "NAND" ? 27 : 31} y={g.type === "NOT" ? 58 : 27} textAnchor="middle" className={styles.gateLabel}>
                {g.type}
              </text>
              {isLit && (
                <text x={w + 6} y="14" className={`${styles.value} ${values[g.id] === 1 ? styles.valueHigh : styles.valueLow} mono`}>
                  {values[g.id]}
                </text>
              )}
              {isActive && !isLit && (
                <text x={w + 6} y="14" className={`${styles.value} ${styles.unknown}`} aria-hidden="true">
                  ?
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
