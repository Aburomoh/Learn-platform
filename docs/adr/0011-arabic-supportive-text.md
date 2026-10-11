# 0011 — Arabic for supportive text, English for everything else
Status: Accepted · Date: 2026-10-11 · Owner: UI / Interaction Engineer (owner directive #633, package #649, UI #650)

## Context
The owner approved an Arabic translation of the supportive text (3,771 entries, about 0.5 MB raw,
`docs/localization/ar/source-texts.ar.json` once #649 merges). Rules in
`docs/localization/ar/REQUIREMENTS.md`: questions, options, equations, notation, labels and
variable names stay English; Arabic prose is RTL with LTR-isolated English runs; Western digits;
**no layout mirroring**; an `EN | عربي` control at the top, immediate and persisted site-wide.
Today: `Prefs.locale: "en" | "ar"` already exists in the prefs record (ADR-0005), the tutor
catalog resolves by key with an empty `ar` map, and the English activity bundle must stay under
200 kB gzip (ADR-0008, `docs/COST_RULES.md`).

## Decision
1. **Preference.** The existing `Prefs.locale` is the switch; no new storage key. It is read with
   `usePrefs()` (a synchronous external store), so the whole page re-renders at once; it persists
   in `cet-learn:v1:prefs` and is cleared with the rest of local data. `<html lang>` stays `en`.
2. **Lookup by the exact English template, before the slots are filled.** One function,
   `translate(english, locale)` in `src/l10n/`, returns the Arabic for an English template or the
   English itself. The map is keyed by the English text (3,749 distinct strings for 3,771 ids: a
   hint in content is a plain string at run time and carries no inventory id). When two ids with
   the same English have different Arabic (four pairs in the approved package: an explanation and a
   hint, the hint without the glossary brackets) the build keeps the first in inventory order and
   prints the pair for the owner; the code never edits Arabic. The lookup happens **at render
   time**: the tutor engine's `SAY` and `REVEAL_HINT` actions carry the unfilled `template` and
   its `vars` beside the filled English, the runner keeps them, and `<SupportiveText>` (or the
   tutor bubble) translates the template and fills the slots when it draws. So a language switch,
   or a map that arrives late, changes the text already on screen. The five sources are tutor
   messages, the hint ladder, answer feedback, explanation steps (`say`) and nudges. Question
   prompts, options, `Notation` tokens, figure captions and accessible summaries never go through it.
3. **Payload, lazy and per course.** A build step (`scripts/build-l10n.mjs`, run by `prebuild`)
   writes `public/l10n/ar/<course>.<hash>.json` and `shared.<hash>.json` (tutor catalog and
   component text) as compact `{english: arabic}` maps from the approved package, plus a small
   `index.json` naming the current files. The name carries a content hash, so corrected Arabic
   reaches students after a deploy; the index is fetched with `cache: "no-cache"`. The output is
   committed: the Vercel build does not upload `docs/` (`.vercelignore`), so there the package is
   absent and the committed maps ship; a unit test keeps them in step with the package, and a CI
   or Vercel build with neither package nor maps fails rather than shipping English silently. The app
   fetches the shared map and the current course's map only while `locale === "ar"`, caches them
   in module memory and re-renders when they arrive. Nothing Arabic is imported by the English
   bundle, which does not change size. The prefs store's server snapshot is English, so the first
   client render matches the static HTML and the switch to Arabic happens after hydration (no
   mismatch); a direct entry with Arabic on shows English for one round trip on the first visit.
4. **Control.** `EN | عربي` as two text buttons in the top bar before the profile button, at every
   width (text, never an icon alone), `aria-pressed` on the active one, the Arabic label itself
   `lang="ar"`. The same choice also appears in Settings beside Appearance.
5. **Rendering.** Supportive text renders through one `<SupportiveText>` component. When the text
   came back translated it is wrapped `dir="rtl" lang="ar"`; English fallback renders exactly as
   today. The Arabic is rendered as React text children, never `dangerouslySetInnerHTML` (the maps
   are data from a file). An Arabic tutor bubble shows at once instead of typing letter by letter. Inside Arabic, each maximal run of Latin letters, digits, operators and notation
   (`A + B`, `Q(t+1)`, `(26)_10`, `T1 → T4`, `110`) is one `<bdi dir="ltr">`, so neither the
   operators nor the digits reorder; `Notation` keeps working inside the run. `dir` is set only on
   text elements, never on a layout container; the page, figures, tables and controls keep their
   English positions (a test asserts no `dir="rtl"` above the text level). Arabic text uses
   `--font-arabic` (system Arabic faces, no webfont download) and keeps the 12 px floor.
6. **Templates with named slots instead of code-built sentences.** The two raw template literals
   (`NumericInput` L63, `ActivitySummary` L32.b) and the audit's assembled component sentences
   become catalog templates with named slots. Count agreement uses `Intl.PluralRules`: a template
   may carry forms per CLDR class (`one`, `other` in English; `zero … other` in Arabic). Their
   Arabic is not in the package (the translators received the JS literal), so they fall back to
   English and are listed in `UNTRANSLATED.md` for the owner.
7. **Scope and drift.** Chrome, navigation titles, figure captions and accessible summaries stay
   English until the owner brings them in scope (AUDIT §3). Missing Arabic always falls back to
   English. A unit test counts the supportive strings on the branch that have no Arabic and fails
   when `UNTRANSLATED.md` reports a different number, so the report cannot go stale silently.

## Consequences
One switch, one lookup, one payload format, one text component. The English experience is
byte-for-byte unchanged with Arabic off. New supportive text written after the inventory falls
back to English until translated (`UNTRANSLATED.md` tracks it). Arabic ordinals and gendered
agreement inside *authored* content are the translators' responsibility, not the code's.

## Alternatives considered
An i18n library (not needed for one lookup; adds bundle). Keying by inventory id (would need the
id plumbed through content, tutor and stage for 3,771 strings). Translating questions or
mirroring the layout (both excluded by the owner). Shipping the Arabic map in the bundle (breaks
the 200 kB budget). A pre-paint script for the language (the first paint is static English HTML
either way; the theme script stays single-purpose by rule #129).
