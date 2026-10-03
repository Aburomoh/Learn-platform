"use client";

import { useEffect, useId, useRef, useState } from "react";
import { focusTarget } from "../shared/types";
import styles from "./BitGrouping.module.css";

export interface BitGroupingProps {
  id: string;
  /** The binary number as found, most significant bit first, without padding. */
  bits: string;
  /** 3 for octal, 4 for hexadecimal. */
  groupSize: 3 | 4;
  /**
   * Completed steps. 0 = the student marks the groups; k ≥ 1 = the digit for group k (from the
   * left) is asked; `groups.length + 1` = done.
   */
  stepIndex: number;
  /** The correct groups, padded, left to right. Shown once the grouping step is done. */
  groups: string[];
  /** The correct digit for each group. Only those already answered are shown. */
  digits: string[];
  /** Step 0: called with the groups the student marked (padded, left to right). */
  onGroups?: (groups: string[]) => void;
  /** Digit steps: called with what the student typed for the active group. */
  onDigit?: (digit: string) => void;
  /** Feedback for the last submitted step. */
  state?: "idle" | "incorrect";
  disabled?: boolean;
  /** Group index to outline (explanations). */
  attention?: number;
}

const BASE_NAME = { 3: "octal", 4: "hexadecimal" } as const;
const DIGIT_PATTERN = { 3: /[^0-7]/g, 4: /[^0-9a-fA-F]/g } as const;

/**
 * Binary to octal or hexadecimal by grouping, one goal at a time (ECET 111 Chapter 1): first the
 * student marks the groups from the right, adding zeros on the left if the first group is short;
 * then each group gets its own digit, left to right. Groups not reached yet show nothing.
 * The component never grades: it reports the marked groups or the typed digit.
 */
export function BitGrouping({ id, bits, groupSize, stepIndex, groups, digits, onGroups, onDigit, state = "idle", disabled = false, attention }: BitGroupingProps) {
  const grouping = stepIndex === 0;
  const done = stepIndex > groups.length;
  const wrong = state === "incorrect" ? styles.wrong : "";

  return (
    <div className={styles.root} data-diagram={id}>
      {grouping ? (
        <MarkGroups bits={bits} groupSize={groupSize} onGroups={disabled ? undefined : onGroups} wrong={wrong} />
      ) : (
        <Digits groups={groups} digits={digits} groupSize={groupSize} active={done ? -1 : stepIndex - 1} onDigit={disabled ? undefined : onDigit} wrong={wrong} attention={attention} />
      )}
      {done && (
        <p className={styles.result} {...focusTarget("group-result")}>
          Put the digits side by side:{" "}
          <strong className="mono">
            ({digits.join("")})<sub>{groupSize === 3 ? 8 : 16}</sub>
          </strong>{" "}
          <span className="sr-only">in {BASE_NAME[groupSize]}</span>
        </p>
      )}
    </div>
  );
}

/** Step 0: tap a bit to start a new group there; pad with zeros on the left. */
function MarkGroups({ bits, groupSize, onGroups, wrong }: { bits: string; groupSize: 3 | 4; onGroups?: (groups: string[]) => void; wrong: string }) {
  const [pad, setPad] = useState(0);
  // A cut is stored as the number of bits to its right, so padding on the left never moves it.
  const [cuts, setCuts] = useState<number[]>([]);
  const padded = "0".repeat(pad) + bits;
  const interactive = !!onGroups;

  const toggle = (fromRight: number) => setCuts((c) => (c.includes(fromRight) ? c.filter((x) => x !== fromRight) : [...c, fromRight]));
  const marked = (): string[] => {
    const out: string[] = [];
    let start = 0;
    for (let i = 1; i <= padded.length; i++) {
      if (i === padded.length || cuts.includes(padded.length - i)) {
        out.push(padded.slice(start, i));
        start = i;
      }
    }
    return out;
  };

  return (
    <form
      className={styles.step}
      aria-label={`Mark groups of ${groupSize} bits`}
      onSubmit={(e) => {
        e.preventDefault();
        if (interactive && cuts.length > 0) onGroups(marked());
      }}
    >
      <p className={styles.ask}>
        Tap a bit to start a new group there. Count {groupSize} bits at a time <strong>from the right</strong>. If the group on the left is short, add zeros in front.
      </p>
      <div className={styles.row} {...focusTarget("bits")}>
        <div className={styles.padButtons}>
          <button type="button" className={`btn ${styles.pad}`} disabled={!interactive || pad >= groupSize} onClick={() => setPad((p) => p + 1)} aria-label="Add a zero on the left" {...focusTarget("pad-zero")}>
            +0
          </button>
          <button type="button" className={`btn ${styles.pad}`} disabled={!interactive || pad === 0} onClick={() => setPad((p) => p - 1)} aria-label="Remove a zero from the left">
            −0
          </button>
        </div>
        <div className={styles.cells}>
          {[...padded].map((bit, i) => {
            const fromRight = padded.length - i;
            const cut = i > 0 && cuts.includes(fromRight);
            const position = `Bit ${i + 1} of ${padded.length}: ${bit}${i < pad ? " (added zero)" : ""}`;
            return i === 0 ? (
              <span key={fromRight} className={`${styles.cell} ${i < pad ? styles.added : ""} ${wrong} mono`} aria-label={position}>
                {bit}
              </span>
            ) : (
              <button
                key={fromRight}
                type="button"
                className={`${styles.cell} ${styles.cellButton} ${cut ? styles.cut : ""} ${i < pad ? styles.added : ""} ${wrong} mono`}
                aria-pressed={cut}
                aria-label={`${position}. Start a new group here`}
                disabled={!interactive}
                onClick={() => toggle(fromRight)}
              >
                {bit}
              </button>
            );
          })}
        </div>
      </div>
      {interactive && (
        <div className={styles.actions}>
          <button type="submit" className="btn btn-primary" disabled={cuts.length === 0}>
            Check groups
          </button>
        </div>
      )}
    </form>
  );
}

/** Digit steps: every group in its box, one digit asked at a time. */
function Digits({
  groups,
  digits,
  groupSize,
  active,
  onDigit,
  wrong,
  attention,
}: {
  groups: string[];
  digits: string[];
  groupSize: 3 | 4;
  active: number;
  onDigit?: (digit: string) => void;
  wrong: string;
  attention?: number;
}) {
  const [text, setText] = useState("");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const asking = active >= 0;
  const interactive = asking && !!onDigit;

  // Remounted on each step: carry keyboard focus to the new group's digit.
  useEffect(() => {
    if (interactive) inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  return (
    <form
      className={styles.step}
      aria-label={`One ${BASE_NAME[groupSize]} digit per group`}
      onSubmit={(e) => {
        e.preventDefault();
        if (interactive && text !== "") onDigit(text);
      }}
    >
      <div className={styles.groups} {...focusTarget("bits")}>
        {groups.map((g, i) => {
          const isActive = i === active;
          const answered = !asking || i < active;
          return (
            <div key={i} className={`${styles.group} ${isActive ? styles.groupActive : ""} ${attention === i ? styles.attention : ""}`} {...focusTarget(`group-${i}`)}>
              <span className={`${styles.groupBits} mono`}>{g}</span>
              <span className={styles.slot}>
                {answered ? (
                  <strong className="mono">
                    <span className="sr-only">digit </span>
                    {digits[i]}
                  </strong>
                ) : isActive && interactive ? (
                  <>
                    <label htmlFor={inputId} className="sr-only">
                      Group {i + 1} of {groups.length}, {g}: {BASE_NAME[groupSize]} digit
                    </label>
                    <input
                      id={inputId}
                      ref={inputRef}
                      className={`${styles.input} ${wrong} mono`}
                      inputMode={groupSize === 4 ? "text" : "numeric"}
                      autoComplete="off"
                      autoCapitalize="characters"
                      value={text}
                      onChange={(e) => setText(e.target.value.replace(DIGIT_PATTERN[groupSize], "").slice(0, 2).toUpperCase())}
                      {...focusTarget("group-digit")}
                    />
                  </>
                ) : isActive ? (
                  <span className={styles.unknown}>?</span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
      {interactive && (
        <div className={styles.actions}>
          <span className={styles.ask}>
            Group {active + 1} of {groups.length}: write <span className="mono">{groups[active]}</span> as one {BASE_NAME[groupSize]} digit
          </span>
          <button type="submit" className="btn btn-primary" disabled={text === ""}>
            Check digit
          </button>
        </div>
      )}
    </form>
  );
}
