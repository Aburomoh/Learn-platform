# Cost Rules

Hosting starts on Vercel Hobby. Resource efficiency is a first-class requirement. Never
architect around an assumed quota number; check current Vercel docs when a limit matters.

## Prefer
Static generation, CDN assets, client-side deterministic interactions and tutor state, cached
content, local guest progress, batched writes, minimal server functions, small payloads.

## Avoid
Server calls on hover/animation/deterministic feedback, LLM calls for known responses, DB writes
per interaction, Blob storage without need, large dependencies for trivial features, realtime
infrastructure without justification, analytics SDKs.

## Gates (ask before adding)
1. Server infra: can the browser do it safely and reliably? If yes, do it there.
2. AI call: can structured logic or pre-generated content do it equally well?
3. Dependency: is the benefit worth bundle + maintenance + complexity? Record an ADR.
4. Paid service: owner approval required (`shared/OWNER_APPROVAL.md`).

## M1 budget
Zero server functions, zero external requests after page load, zero paid services.
Bundle: keep first-load JS for the stage route well under 200 kB gzipped; CI prints the size.
