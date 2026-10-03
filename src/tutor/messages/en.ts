/**
 * English message catalog. Keys are stable; text is instructor-approved. Keep messages short:
 * the tutor reacts, it does not lecture. `{slot}` values come from the activity variables.
 */
export const en: Record<string, string> = {
  // generic flow
  "open": "Give it a try. I will step in only if you want me to.",
  "wrong.first": "Not quite. Look at it once more and try again.",
  "wrong.second": "Still not there. Here is a reminder of the idea.",
  "wrong.again": "Let us slow down. I will point at the part to check.",
  "correct": "Good. That is right.",
  "correct.after-hints": "Right. Try a similar one on your own to make it stick.",
  "hint.try-first": "Give it one try first. Then I can help.",
  "hints.exhausted": "That is everything I can hint. Ask me to explain slowly, or try again.",
  "hesitation": "Take your time. If you are unsure where to start, ask for a hint.",
  "explain.start": "Let us go through it slowly, one step at a time.",
  "explain.done": "Now you try. Same method.",
  "retry.variant": "Here is a similar one.",
  "retry.same": "Reset. Try again from the start.",
  "step.next": "Good. Next step.",
  "prediction.correct": "Yes.",
  "prediction.wrong": "Not quite. Here is why.",

  // misconception nudges referenced by content (nudgeKey)
  "div.remainder": "The division is right. Check the remainder: is {dividend} even or odd?",
  "div.quotient": "The remainder is right. Check the top number: half of {dividend}, rounded down.",
  "div.swapped": "They are swapped. The result of the division goes in the row below; the remainder goes beside the number.",
  "ns.read-reversed": "That is top to bottom. Read the remainders from the bottom (MSB) up to the top (LSB).",
  "ns.group-from-left": "Group from the right-hand side, and add zeros on the left if a group is short.",
  "ns.wrong-group-size": "Check the group size: 3 bits for octal, 4 bits for hexadecimal.",
  "ns.reversed": "The order looks reversed. The largest place value is on the left.",
  "ns.missing-largest": "Check the largest place value. Does {largest} fit in {value}?",
  "ns.extra-place": "One of the lit places is too big for what is left. Check the remainder after each step.",
  "ns.hex-letter": "In hex, 10 to 15 are single letters A to F, not two digits.",
  "ns.copied-decimal": "That is the decimal value. Group {answerBits} in groups of {groupSize} bits from the right, then convert each group.",
  "lg.check-not": "Look at the NOT gate again. It flips its input.",
  "lg.follow-through": "The NOT output is not the final answer. Follow the signal through the next gates.",
  "lg.or-vs-and": "OR is satisfied by any 1. Which gate needs every input to be 1?",
  "lg.xor-vs-and": "XOR outputs 1 when the inputs differ. That is not what the question asks.",
  "lg.nand-inverted": "NAND is the opposite of AND. Think about what it outputs when both inputs are 1.",
  "lg.nor-inverted": "NOR is the opposite of OR. Which gate outputs 1 when any input is 1?",
};
