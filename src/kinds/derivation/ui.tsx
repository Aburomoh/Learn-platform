"use client";

import { useState } from "react";
import { MultipleChoice } from "@/interactions/MultipleChoice/MultipleChoice";
import { Prompt } from "../shared/Prompt";
import shared from "../shared/shared.module.css";
import type { ExplainProps, PracticeProps } from "../types";
import { DerivationLines, type DerivationRow } from "./DerivationLines";
import { LAW_NAMES, lawChips, lineOptions, type DerivationAnswer } from "./logic";
import type { DerivationSpec } from "./spec";
import styles from "./DerivationLines.module.css";

/**
 * The lines as drawn at goal `step` (2 per line: law, then line). `step` past the end = finished.
 * `lawKnown`: the law of the current line is shown (its law goal is done, or Explain revealed it).
 */
function rowsAt(spec: DerivationSpec, step: number, lawKnown: boolean): DerivationRow[] {
  const current = Math.floor(step / 2);
  const rows: DerivationRow[] = [{ expr: spec.start, law: "Given", state: "done" }];
  spec.lines.forEach((l, i) => {
    if (i < current) rows.push({ expr: l.expr, law: LAW_NAMES[l.law], state: "done" });
    else if (i === current) rows.push({ expr: null, law: lawKnown || step % 2 === 1 ? LAW_NAMES[l.law] : "Law: ?", state: "now" });
    else rows.push({ expr: null, law: null, state: "later" });
  });
  return rows;
}

export function Practice({ variant, prompt, state, last, stepIndex, locked, onSubmit }: PracticeProps<DerivationSpec, DerivationAnswer>) {
  const { spec } = variant;
  const finished = state === "correct" && locked;
  const step = finished ? spec.lines.length * 2 : stepIndex;
  const i = Math.floor(step / 2);
  const line = spec.lines[i];
  const isLaw = step % 2 === 0;
  const submitted = last?.answer.kind === "derivation" && last.answer.step === step ? last.answer : undefined;

  return (
    <>
      <Prompt text={prompt} />
      <DerivationLines id={variant.id} rows={rowsAt(spec, step, false)} />
      {!finished && line && (
        <>
          <p className={shared.stepLabel} aria-live="polite">
            Line {i + 2} of {spec.lines.length + 1}: {isLaw ? "name the law" : "give the line"}
          </p>
          {isLaw ? (
            <MultipleChoice
              key={`law-${step}`}
              id={`${variant.id}-law-${i}`}
              prompt={`Which law takes line ${i + 1} one step further?`}
              options={lawChips(spec, i).map((law) => ({ id: law, text: LAW_NAMES[law] }))}
              disabled={locked}
              state={state}
              submittedOptionId={submitted?.law}
              submitLabel="Check law"
              onAnswer={(law) => onSubmit({ kind: "derivation", step, law: law as DerivationAnswer["law"] })}
            />
          ) : spec.lineMode === "choose" ? (
            <MultipleChoice
              key={`line-${step}`}
              id={`${variant.id}-line-${i}`}
              prompt={`${LAW_NAMES[line.law]}: which line does it give?`}
              options={lineOptions(spec, i).map((o) => ({ id: o.id, text: o.expr }))}
              disabled={locked}
              state={state}
              submittedOptionId={submitted?.line}
              submitLabel="Check line"
              onAnswer={(id) => onSubmit({ kind: "derivation", step, line: id })}
            />
          ) : (
            <TypedLine key={`typed-${step}`} label={`Line ${i + 2}, after ${LAW_NAMES[line.law]}`} state={state} disabled={locked} submitted={submitted?.line} onAnswer={(text) => onSubmit({ kind: "derivation", step, line: text })} />
          )}
        </>
      )}
    </>
  );
}

/**
 * Type mode: a plain mono field. (The expression kind's key row and overbar reading move to
 * `kinds/shared` once both kinds have landed, and this field uses them then.)
 */
function TypedLine({ label, state, disabled, submitted, onAnswer }: { label: string; state: string; disabled: boolean; submitted?: string; onAnswer: (text: string) => void }) {
  const [text, setText] = useState(submitted ?? "");
  return (
    <form
      className={styles.typed}
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim() && !disabled) onAnswer(text.trim());
      }}
    >
      <input className={`${styles.field} mono`} aria-label={label} aria-invalid={state === "incorrect" || undefined} value={text} disabled={disabled} autoComplete="off" spellCheck={false} onChange={(e) => setText(e.target.value)} />
      <button type="submit" className="btn btn-primary" disabled={disabled || !text.trim()}>
        Check line
      </button>
    </form>
  );
}

/**
 * Explain Slowly reuses the lines read-only (UX §1). Content stages: `line` = the line being
 * explained (1-based; omit for the full derivation), `law` = show its law, `shown` = show the line too.
 */
export function Explain({ variant, stage }: ExplainProps<DerivationSpec>) {
  const { spec } = variant;
  const n = stage.line as number | undefined;
  if (n === undefined) return <DerivationLines id={variant.id} rows={rowsAt(spec, spec.lines.length * 2, true)} />;
  const rows = rowsAt(spec, (n - 1) * 2, !!stage.law);
  if (stage.shown) rows[n] = { ...rows[n], expr: spec.lines[n - 1].expr };
  return <DerivationLines id={variant.id} rows={rows} />;
}

/** Draws nothing: mounting it downloads this kind's chunk ahead of use (see `KindPrefetch`). */
export function Preload() {
  return null;
}

// stable marker: the size report attributes this chunk to the kind (ADR-0008)
Practice.displayName = "kind:derivation";
