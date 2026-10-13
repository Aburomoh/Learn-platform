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

**Experience budget (owner, 2026-10-13, #683 Option C, refined in #699):** "usable" means the
student can answer. Profile: Pixel 7, Slow 4G (562.5 ms RTT, 1.47 Mbps), 4× CPU, cold cache, median
of 5, against the deployed site (production or a Vercel preview), on a quiet machine.
- **Primary: can answer.** From navigation start until the first intended answer input (tap an
  option, type into the first answer field) gets its visible response from the app (e.g. Check
  turns on). A challenge the student can see but not use is not usable. Desired **~3 s**. This is
  a target, not a release blocker: a clean measurement above it opens a performance task and does
  not block educational or navigation work.
- **Secondary: challenge visible** (diagnostic). `scripts/throttled-load.mjs` reports it as `stage`;
  its `hydrated` is only a lower bound for the primary metric. Record both metrics.
- No kB-only optimisation that does not improve the primary metric.

**Size warning (advisory, not a gate):** first-load JS over 200 kB gzip on any route is a warning.
CI prints the size per route (`scripts/size-report.mjs`, step summary, report only). A PR that
crosses it, or adds > 10 kB gzip to the activity route, says why. No uncontrolled growth.

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

## Re-measure — 2026-10-03, `cf3fdfb` (#154, after M1.2 #34/#36)
Activity routes (all five share one bundle): **160.3 kB** gzip (+9.0 kB vs baseline; app chunk
16.4 → 25.4 kB). Base unchanged at 134.0 kB. Headroom ~40 kB. Every activity ships every interaction
component; consider per-component code splitting if headroom falls below ~25 kB.

Throttled phone, A/B on one machine (baseline vs now, median of 5, two rounds). `stage` = challenge
on screen, `hydrated` = React attached (both from navigation start):

| | FCP | Question visible | Hydrated | TBT | Transfer |
|---|---:|---:|---:|---:|---:|
| `c817572` | 1.65 s | at FCP (in HTML) | 2.68 s | ~270 ms | 165 kB |
| `cf3fdfb` | 1.43 s | **3.43 s** | 3.17 s | ~380 ms | 179 kB |

Main regression is not size: since #144 the exported HTML holds an empty stage frame, so the question
waits for JS on slow phones (+~1.8 s). Tracked in #158.

## Re-measure — 2026-10-13, #683 (lazy per-kind logic)
Activity pages now load only their kinds' logic (`KindLogicGate`), and import the shell directly.
Heaviest activity route **199.8 → 183.8 kB** gzip (16.2 kB under the warning). Throttled phone,
two A/B rounds, local server: `stage` ≈ 1.8 s and `hydrated` ≈ 4.0–4.3 s both before and after
(differences within run-to-run noise), ~15–19 kB less transferred. `hydrated` misses the 3 s
budget before and after this change.

## Re-measure — 2026-10-13, production `80921ee` (#699)
Deployed site, profile above, two rounds of 5 (median of 10): challenge visible 2.0–2.2 s, can
answer 4.4–5.0 s (heaviest ECET111, typical ECET111, typical CPET181). Locally, main (`5ccfa7b`) is
within noise of `80921ee`. Details and the startup plan: #699.
