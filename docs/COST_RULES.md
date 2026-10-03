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
Bundle: keep first-load JS for the stage route well under 200 kB gzipped; CI prints the size
per route (`scripts/size-report.mjs`, step summary, report only).

## Baseline — 2026-10-03, `c817572` (#50)
First-load JS, gzip -9, excluding the `noModule` legacy polyfill (39 kB, never fetched by modern browsers):

| Route | Gzip kB | Raw kB |
|---|---:|---:|
| Activity (`/courses/…/[activity]`) | 151.3 | 506.7 |
| Topic / settings | 135.5–135.8 | 455–456 |
| Shared Next + React base (home, course) | 134.0 | 451.0 |

The activity runner adds 17.3 kB over the base; zod is not in the client bundle. Headroom to the
200 kB budget: ~49 kB. Any PR adding >10 kB gzip to the activity route should say why.

Throttled phone (`scripts/throttled-load.mjs`: Pixel 7, Slow 4G 562.5 ms RTT / 1.47 Mbps, 4× CPU,
cold cache, gzip, median of 5), activity route: FCP = LCP 1.57 s, load 2.33 s, hydrated 2.64 s,
TBT 227 ms, 165 kB transferred. Local server: add ~0.6 s (one RTT) for real document TTFB.
