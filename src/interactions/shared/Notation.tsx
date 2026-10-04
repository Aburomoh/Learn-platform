import { Fragment } from "react";
import { readPower, splitNotation } from "@/content/notation";

/**
 * Text for assistive technology only. `user-select: none` keeps it out of copy and paste, so a
 * pasted "(26)_10" reads "(26)10" rather than "(26)1026 base 10".
 */
function Spoken({ children }: { children: string }) {
  return (
    <span className="sr-only" style={{ userSelect: "none" }}>
      {children}
    </span>
  );
}

/**
 * Renders authored text, turning base-notation tokens such as `(26)_10` into "(26)" with a real
 * subscript and powers such as `10^−2` into "10" with a real superscript (#409). Sighted readers
 * see the sub/superscript; assistive technology gets "26 base 10" or "10 to the power minus 2".
 */
export function Notation({ text }: { text: string }) {
  const parts = splitNotation(text);
  if (parts.length === 1 && "text" in parts[0]) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) =>
        "text" in p ? (
          <Fragment key={i}>{p.text}</Fragment>
        ) : "power" in p ? (
          <span key={i} data-power={p.exp}>
            <span aria-hidden="true">
              {p.power}
              <sup>{p.exp}</sup>
            </span>
            <Spoken>{readPower(p)}</Spoken>
          </span>
        ) : (
          <span key={i} data-base={p.base}>
            <span aria-hidden="true">
              {p.parens ? `(${p.value})` : p.value}
              <sub>{p.base}</sub>
            </span>
            <Spoken>{`${p.value} base ${p.base}`}</Spoken>
          </span>
        ),
      )}
    </>
  );
}
