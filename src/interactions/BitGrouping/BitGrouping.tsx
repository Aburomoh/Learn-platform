"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import { focusTarget } from "../shared/types";
import { useScrollFade } from "../shared/useScrollFade";
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
  /** Number of whole-part groups when the number has a binary point: the point is drawn after them. */
  pointAfter?: number;
  /**
   * `to-bits` (octal/hex → binary): the digits are given and each gets its 3 or 4 bits, one digit
   * per step. `stepIndex` is then the number of digits done.
   */
  direction?: "to-digits" | "to-bits";
  /** to-bits: called with the bits typed for the active digit. */
  onBits?: (bits: string) => void;
}

const BASE_NAME = { 3: "octal", 4: "hexadecimal" } as const;
const DIGIT_PATTERN = { 3: /[^0-7]/g, 4: /[^0-9a-fA-F]/g } as const;

/**
 * Binary to octal or hexadecimal by grouping, one goal at a time (ECET 111 Chapter 1): first the
 * student marks the groups from the right, adding zeros on the left if the first group is short;
 * then each group gets its own digit, left to right. Groups not reached yet show nothing.
 * The component never grades: it reports the marked groups or the typed digit.
 */
export function BitGrouping({ id, bits, groupSize, stepIndex, groups, digits, onGroups, onDigit, state = "idle", disabled = false, attention, pointAfter, direction = "to-digits", onBits }: BitGroupingProps) {
  const wrong = state === "incorrect" ? styles.wrong : "";
  const withPoint = (parts: string[]) => (pointAfter === undefined ? parts.join("") : `${parts.slice(0, pointAfter).join("")}.${parts.slice(pointAfter).join("")}`);

  if (direction === "to-bits") {
    const done = stepIndex >= groups.length;
    return (
      <div className={styles.root} data-diagram={id}>
        <DigitsToBits groups={groups} digits={digits} groupSize={groupSize} active={done ? -1 : stepIndex} onBits={disabled ? undefined : onBits} wrong={wrong} attention={attention} pointAfter={pointAfter} />
        {done && (
          <p className={styles.result} {...focusTarget("group-result")}>
            Put the groups side by side:{" "}
            <strong className="mono">
              ({withPoint(groups)})<sub>2</sub>
            </strong>{" "}
            <span className="sr-only">in binary</span>
          </p>
        )}
      </div>
    );
  }

  const grouping = stepIndex === 0;
  const done = stepIndex > groups.length;

  return (
    <div className={styles.root} data-diagram={id}>
      {grouping ? (
        <MarkGroups bits={bits} groupSize={groupSize} onGroups={disabled ? undefined : onGroups} wrong={wrong} />
      ) : (
        <Digits groups={groups} digits={digits} groupSize={groupSize} active={done ? -1 : stepIndex - 1} onDigit={disabled ? undefined : onDigit} wrong={wrong} attention={attention} pointAfter={pointAfter} />
      )}
      {done && (
        <p className={styles.result} {...focusTarget("group-result")}>
          Put the digits side by side:{" "}
          <strong className="mono">
            ({withPoint(digits)})<sub>{groupSize === 3 ? 8 : 16}</sub>
          </strong>{" "}
          <span className="sr-only">in {BASE_NAME[groupSize]}</span>
        </p>
      )}
    </div>
  );
}

/** The binary point between the whole part and the fraction. */
function Point() {
  return (
    <span className={`${styles.point} mono`} role="img" aria-label="binary point">
      •
    </span>
  );
}

/**
 * Step 0: tap a bit to start a new group there. Groups run outward from the binary point: the
 * whole part is padded with zeros on the far left, a fraction on the far right (s.22).
 */
function MarkGroups({ bits, groupSize, onGroups, wrong }: { bits: string; groupSize: 3 | 4; onGroups?: (groups: string[]) => void; wrong: string }) {
  const [whole, frac = ""] = bits.split(".");
  const hasPoint = frac !== "";
  const [pad, setPad] = useState(0);
  const [padEnd, setPadEnd] = useState(0);
  // A whole-part cut is stored as the number of whole bits to its right ("w4"), a fraction cut as
  // the number of fraction bits to its left ("f4"), so padding at either end never moves a cut.
  const [cuts, setCuts] = useState<string[]>([]);
  const left = "0".repeat(pad) + whole;
  const right = frac + "0".repeat(padEnd);
  const total = left.length + right.length;
  const interactive = !!onGroups;
  // A long row scrolls inside its own box; the faded edge shows there is more.
  const cellsRef = useRef<HTMLDivElement>(null);
  const fade = useScrollFade(cellsRef);
  const fractionRef = useRef<HTMLDivElement>(null);
  const fractionFade = useScrollFade(fractionRef);
  // With a point, the whole part's row ends at the point: if it has to scroll, it starts at that end.
  useEffect(() => {
    const box = cellsRef.current;
    if (hasPoint && box && box.scrollWidth > box.clientWidth) box.scrollLeft = box.scrollWidth;
  }, [hasPoint, pad]);

  const toggle = (cut: string) => setCuts((c) => (c.includes(cut) ? c.filter((x) => x !== cut) : [...c, cut]));
  const split = (text: string, cutBefore: (i: number) => boolean): string[] => {
    const out: string[] = [];
    let start = 0;
    for (let i = 1; i <= text.length; i++) {
      if (i === text.length || cutBefore(i)) {
        out.push(text.slice(start, i));
        start = i;
      }
    }
    return out;
  };
  const marked = (): string[] => {
    const wholeGroups = split(left, (i) => cuts.includes(`w${left.length - i}`));
    return hasPoint ? [...wholeGroups, ".", ...split(right, (i) => cuts.includes(`f${i}`))] : wholeGroups;
  };

  /** One bit cell: the first cell of each part cannot start a group (it already does). */
  const cell = (bit: string, index: number, key: string, first: boolean, added: boolean) => {
    const cut = !first && cuts.includes(key);
    const position = `Bit ${index + 1} of ${total}: ${bit}${added ? " (added zero)" : ""}`;
    return first ? (
      <span key={key} className={`${styles.cell} ${added ? styles.added : ""} ${wrong} mono`} aria-label={position}>
        {bit}
      </span>
    ) : (
      <button
        key={key}
        type="button"
        className={`${styles.cell} ${styles.cellButton} ${cut ? styles.cut : ""} ${added ? styles.added : ""} ${wrong} mono`}
        aria-pressed={cut}
        aria-label={`${position}. Start a new group here`}
        disabled={!interactive}
        onClick={() => toggle(key)}
      >
        {bit}
      </button>
    );
  };

  const frontButtons = (
    <div className={styles.padButtons}>
      <button type="button" className={`btn ${styles.pad}`} disabled={!interactive || pad >= groupSize} onClick={() => setPad((p) => p + 1)} aria-label={hasPoint ? undefined : "Add a leading zero"} {...focusTarget("pad-zero")}>
        {hasPoint ? "Add 0 in front" : "Add 0"}
      </button>
      <button type="button" className={`btn ${styles.pad}`} disabled={!interactive || pad === 0} onClick={() => setPad((p) => p - 1)} aria-label={hasPoint ? "Remove 0 in front" : "Remove a leading zero"}>
        Remove 0
      </button>
    </div>
  );

  return (
    <form
      className={styles.step}
      aria-label={`Mark groups of ${groupSize} bits`}
      onSubmit={(e) => {
        e.preventDefault();
        // No cut is a valid answer: a number that is a single group.
        if (interactive) onGroups(marked());
      }}
    >
      {hasPoint ? (
        <p className={styles.ask}>
          Tap a bit to start a new group there. Count {groupSize} bits at a time <strong>outward from the point</strong>: leftwards before it, rightwards after it. If a group at either end is short, add zeros at that end.
        </p>
      ) : (
        <p className={styles.ask}>
          Tap a bit to start a new group there. Count {groupSize} bits at a time <strong>from the right</strong>. If the group on the left is short, add zeros in front.
        </p>
      )}
      {hasPoint ? (
        // Two halves that meet at the point. From 640 px they read as one row; on a phone each is
        // its own row (whole part right-aligned, ending at the point; fraction starting at it), so
        // the point is always on screen and each row is grouped outward from its point end (#498).
        <div className={styles.row} data-point="" {...focusTarget("bits")}>
          <div className={styles.half} data-half="whole">
            <span className={styles.halfLabel}>Whole part</span>
            {frontButtons}
            <div className={styles.cells} ref={cellsRef} data-fade={fade}>
              {[...left].map((bit, i) => cell(bit, i, `w${left.length - i}`, i === 0, i < pad))}
              {/* phones only: the point again, at the end of the whole part's row */}
              <span className={`${styles.point} ${styles.pointEnd} mono`} aria-hidden="true">
                •
              </span>
            </div>
          </div>
          <div className={styles.half} data-half="fraction">
            <span className={styles.halfLabel}>Fraction</span>
            <div className={styles.cells} ref={fractionRef} data-fade={fractionFade}>
              <Point />
              {[...right].map((bit, j) => cell(bit, left.length + j, `f${j}`, j === 0, j >= frac.length))}
            </div>
            <div className={`${styles.padButtons} ${styles.padEnd}`}>
              <button type="button" className={`btn ${styles.pad}`} disabled={!interactive || padEnd >= groupSize} onClick={() => setPadEnd((p) => p + 1)} {...focusTarget("pad-zero-end")}>
                Add 0 at the end
              </button>
              <button type="button" className={`btn ${styles.pad}`} disabled={!interactive || padEnd === 0} onClick={() => setPadEnd((p) => p - 1)} aria-label="Remove 0 at the end">
                Remove 0
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.row} {...focusTarget("bits")}>
          {frontButtons}
          <div className={styles.cells} ref={cellsRef} data-fade={fade}>
            {[...left].map((bit, i) => cell(bit, i, `w${left.length - i}`, i === 0, i < pad))}
          </div>
        </div>
      )}
      {interactive && (
        <div className={styles.actions}>
          <button type="submit" className="btn btn-primary">
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
  pointAfter,
}: {
  groups: string[];
  digits: string[];
  groupSize: 3 | 4;
  active: number;
  onDigit?: (digit: string) => void;
  wrong: string;
  attention?: number;
  pointAfter?: number;
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
            <Fragment key={i}>
            {pointAfter === i && <Point />}
            <div className={`${styles.group} ${isActive ? styles.groupActive : ""} ${attention === i ? styles.attention : ""}`} {...focusTarget(`group-${i}`)}>
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
            </Fragment>
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

/** to-bits: every digit over its 3- or 4-bit slot; the bits of one digit are asked at a time. */
function DigitsToBits({
  groups,
  digits,
  groupSize,
  active,
  onBits,
  wrong,
  attention,
  pointAfter,
}: {
  groups: string[];
  digits: string[];
  groupSize: 3 | 4;
  active: number;
  onBits?: (bits: string) => void;
  wrong: string;
  attention?: number;
  pointAfter?: number;
}) {
  const [text, setText] = useState("");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const asking = active >= 0;
  const interactive = asking && !!onBits;

  // Remounted on each step: carry keyboard focus to the new digit's bits (not on the first, so a page load does not steal focus).
  useEffect(() => {
    if (interactive && active > 0) inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  return (
    <form
      className={styles.step}
      aria-label={`${groupSize} bits per ${BASE_NAME[groupSize]} digit`}
      onSubmit={(e) => {
        e.preventDefault();
        if (interactive && text !== "") onBits(text);
      }}
    >
      <div className={styles.groups} {...focusTarget("bits")}>
        {digits.map((d, i) => {
          const isActive = i === active;
          const answered = !asking || i < active;
          return (
            <Fragment key={i}>
              {pointAfter === i && <Point />}
              <div className={`${styles.group} ${isActive ? styles.groupActive : ""} ${attention === i ? styles.attention : ""}`} {...focusTarget(`group-${i}`)}>
                <strong className={`${styles.groupBits} mono`}>
                  <span className="sr-only">digit </span>
                  {d}
                </strong>
                <span className={`${styles.slot} ${styles.slotBits}`}>
                  {answered ? (
                    <span className="mono">
                      <span className="sr-only">bits </span>
                      {groups[i]}
                    </span>
                  ) : isActive && interactive ? (
                    <>
                      <label htmlFor={inputId} className="sr-only">
                        Digit {i + 1} of {digits.length}, {d}: its {groupSize} bits
                      </label>
                      <input
                        id={inputId}
                        ref={inputRef}
                        className={`${styles.input} ${styles.inputBits} ${wrong} mono`}
                        inputMode="numeric"
                        autoComplete="off"
                        value={text}
                        onChange={(e) => setText(e.target.value.replace(/[^01]/g, "").slice(0, groupSize))}
                        {...focusTarget("group-bits")}
                      />
                    </>
                  ) : isActive ? (
                    <span className={styles.unknown}>?</span>
                  ) : null}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>
      {interactive && (
        <div className={styles.actions}>
          <span className={styles.ask}>
            Digit {active + 1} of {digits.length}: write <span className="mono">{digits[active]}</span> as {groupSize} bits
          </span>
          <button type="submit" className="btn btn-primary" disabled={text === ""}>
            Check bits
          </button>
        </div>
      )}
    </form>
  );
}
