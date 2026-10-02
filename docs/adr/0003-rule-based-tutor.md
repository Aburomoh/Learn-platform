# 0003 — Rule-based tutor engine, no LLM in v1
Status: Accepted · Date: 2026-10-03 · Owner: AI Tutor Engineer

## Context
Course truth must be deterministic and instructor-approved; cost must stay near zero; the tutor
should feel like an instructor beside a whiteboard, mostly quiet.

## Decision
A pure reducer `(state, event, ctx) -> { state, actions }` drives all tutoring. Output is a list
of structured `TutorAction`s (SAY, FOCUS, HIGHLIGHT, PULSE, WAIT, ASK, REVEAL_HINT,
ADVANCE_EXPLANATION, RESET_INTERACTION, REQUEST_RETRY, CHANGE_EXPRESSION, COMPLETE). Messages come
from a keyed template catalog with locale fallback. A `ConversationalTutorAdapter` interface is
declared; only `RuleBasedTutor` is implemented. No model calls of any kind in M1.

## Consequences
Fully testable, runs offline, zero cost. Dialogue variety is limited to the catalog (accepted).
A future local model may choose among approved messages but never decide correctness.

## Alternatives considered
Commercial LLM tutor (cost, non-determinism, truth risk). Local model now (no M1 benefit).
