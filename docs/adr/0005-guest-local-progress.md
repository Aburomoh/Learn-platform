# 0005 — Guest progress in localStorage
Status: Accepted · Date: 2026-10-03 · Owner: Backend / Data Engineer

## Context
Guest-first access, no accounts in M1, no server cost, profiles scoped to one course offering.

## Decision
Progress is stored in `localStorage` under `cet-learn:v1:progress:<offeringId>`; durable
preferences under `cet-learn:v1:prefs`. Writes are debounced (about 1 s) and the store is
versioned so a later migration can read v1. Reads and writes are wrapped in try/catch; the app
works fully with storage unavailable (private mode). A Settings action clears local data.

## Consequences
Progress is per browser and can be lost by the student clearing data (accepted for a guest
companion). Account sync later uploads the same shape in batches.

## Alternatives considered
IndexedDB (no benefit at this size). Cookie or server session (cost, privacy, no benefit).
