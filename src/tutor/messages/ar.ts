/**
 * Arabic catalog slots. Every `en` key is listed (the type enforces it); an empty string means
 * "not translated yet" and falls back to `en`. Fill only with instructor-approved Arabic, keep
 * every `{slot}` from the English text, and keep messages as short as the English ones.
 */
import type { MessageKey } from "./en";

export const ar: Record<MessageKey, string> = {
  // generic flow
  "open": "",
  "wrong.first": "",
  "wrong.second": "",
  "wrong.again": "",
  "correct": "",
  "correct.after-hints": "",
  "hint.try-first": "",
  "hints.exhausted": "",
  "hesitation": "",
  "explain.start": "",
  "explain.done": "",
  "retry.variant": "",
  "retry.same": "",
  "step.next": "",
  "step.next-gate": "",
  "step.last-gate": "",
  "prediction.correct": "",
  "prediction.wrong": "",

  // misconception nudges referenced by content (nudgeKey)
  "div.remainder": "",
  "div.quotient": "",
  "div.swapped": "",
  "ns.read-reversed": "",
  "ns.group-from-left": "",
  "ns.wrong-group-size": "",
  "ns.reversed": "",
  "ns.missing-largest": "",
  "ns.extra-place": "",
  "ns.hex-letter": "",
  "ns.copied-decimal": "",
  "lg.check-not": "",
  "lg.check-and": "",
  "lg.check-or": "",
  "lg.follow-through": "",
  "lg.or-vs-and": "",
  "lg.xor-vs-and": "",
  "lg.nand-inverted": "",
  "lg.nor-inverted": "",

  // gate-by-gate circuit walk: filled into {gateRule}, {gateAnalogy}, {gateInputs} for the active gate
  "gate.rule.NOT": "",
  "gate.rule.AND": "",
  "gate.rule.OR": "",
  "gate.rule.XOR": "",
  "gate.rule.NAND": "",
  "gate.rule.NOR": "",
  "gate.analogy.NOT": "",
  "gate.analogy.AND": "",
  "gate.analogy.OR": "",
  "gate.analogy.XOR": "",
  "gate.analogy.NAND": "",
  "gate.analogy.NOR": "",
  "gate.output-of": "",
  "gate.input": "",
  "gate.inputs-two": "",
};
