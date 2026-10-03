import { Fragment } from "react";
import { splitNotation } from "@/content/notation";

/**
 * Renders authored text, turning base-notation tokens such as `(26)_10` into "(26)" with a real
 * subscript. Sighted readers see the subscript at `--sub-size`; assistive technology gets
 * "26 base 10" instead of the punctuation.
 */
export function Notation({ text }: { text: string }) {
  const parts = splitNotation(text);
  if (parts.length === 1 && "text" in parts[0]) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) =>
        "text" in p ? (
          <Fragment key={i}>{p.text}</Fragment>
        ) : (
          <span key={i} data-base={p.base}>
            <span aria-hidden="true">
              {p.parens ? `(${p.value})` : p.value}
              <sub>{p.base}</sub>
            </span>
            <span className="sr-only">
              {p.value} base {p.base}
            </span>
          </span>
        ),
      )}
    </>
  );
}
