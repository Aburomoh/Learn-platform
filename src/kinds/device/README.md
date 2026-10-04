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
- Detectors: `bits-reversed` (the code read LSB first, as in "wrong select order, bit reversal")
  and `counted-from-one` (D1 for code 000).
- Step vars: `given` ("S1 = 1, S0 = 0", or "I6" for an encoder), `codeBits`, `answerName`,
  `deviceSize` ("3-to-8"), `askCount`, `stepNumber`.

**Status:** spec, grading and tests. The view, and registration with it (ADR-0008), are next
(Frontend, #381, #382).
