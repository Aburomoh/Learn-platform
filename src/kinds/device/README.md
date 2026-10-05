# device

Decoder, encoder and multiplexer views (#381, #382; representations §8; pack ch4 §3, §5). The
device is drawn. **One goal per entry of `asks`:** the student picks a line. Answer `pick`.

| `device` | an ask is | the pick is | shown as |
|---|---|---|---|
| `decoder` | the input code | the active output k | D5 |
| `encoder` | the active input k | the output code | 101 |
| `mux` | the select value | the input that reaches Y | I2 |

- Spec:
  - `bits`: the code width, 1 to 3 (2-to-1 mux; 2-to-4 / 4-to-1; 3-to-8 / 8-to-3);
  - `names`: code-bit names, MSB first; S1 S0 for a mux, x y z otherwise;
  - `data`: mux only, optional, a level printed on each input.
- Truth is computed with the Boolean module (`rightPick`), never authored:
  - decoder: Dk = minterm k;
  - encoder: each code bit is the OR of the inputs whose number has that bit;
  - mux: Y = Σ select term · Ik.
- Detectors: `code-reversed` (the code read LSB first, as in "wrong select order, bit reversal")
  and `counted-from-one` (D1 for code 000).
- Step vars: `given` ("S1 = 1, S0 = 0", or "I6" for an encoder), `codeBits`, `answerName`,
  `deviceSize` ("3-to-8"), `askCount`, `stepNumber`.

## View (`ui.tsx`, `DeviceDiagram.tsx`; the block is `shared/figures/DeviceFigure`, ADR-0009; representations §8)

- **Block:** a rectangle labelled "3→8 DEC" / "8→3 ENC", or the slides' trapezoid "4→1 MUX".
  Inputs on the left, outputs on the right; a mux's selects enter from the bottom.
- **What is given is printed on the diagram:** the code bits on a decoder's inputs, the active
  input of an encoder (marked and "1"), the select values of a mux (and `data` levels, if any).
- **Predict first:** the student picks from chips in one `radiogroup` (D0…D7, I0…I3, or the codes),
  then **Check**. On a decoder or mux, tapping a line picks it too. Nothing is drawn before the
  answer.
- **After the answer** (when the question is finished, or in Explain Slowly with `answer`): the
  line is drawn in `--signal-high`, thicker, with its value; a mux shows the path from the input to Y.
- **Screen reader:** `role="img"` with the device, what is given and, once shown, the answer.
- **Focus targets:** `device`, `line-<name>` (D5, I2, S1, x), `pick-<n>`.
- **Explain Slowly stages:** `ask` (index of the ask shown), `answer` (draw its answer).
- The detector is named `code-reversed`: `bits-reversed` belongs to bit-grouping, and the
  schema's detector union needs unique names.

**Status:** spec, grading, tests and the view; registered.
