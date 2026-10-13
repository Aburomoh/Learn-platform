# Navigation and information-architecture audit (epic #670)

Role: UX / Design Engineer (on demand) · 2026-10-13 · main @ 44c8a6e · production https://cet-learn.vercel.app
Status: **audit and proposal only**. No code. Inputs: the owner's directive on #670, the UI Engineer's navigation
facts (#670, file-cited), the Content Engineer's direct-entry inventory (#670, 148 practices, 307 questions),
the Reviewer's production baseline (#670, journeys A–G at 390/768/1280). I re-walked every journey on production
in headless Chromium at 390×844, 768×1024 and 1280×800; my numbers agree with the Reviewer's, and the few
additions are marked "(UX)". Prior directives honoured: question-context rule (#568, #624), epic #110 (classroom,
calm landing, no radical change), tutor "Mr. Mohanad", ADR-0011 (`EN | عربي`, new labels need Arabic).

Principle tested throughout: **guide, but do not trap**. The recommended order is a suggestion; every unit is
reachable, leavable and locatable. Three intentions must each take one obvious path: *I don't know where to
start* · *continue genuine study* · *practise X*.

---

## 1. Root causes

Five causes explain every failure in §2. They are ordered by how much they explain.

**RC1 — "Opened" is recorded as "studying".** `startActivity` runs on runner mount
(`src/stage/ActivityRunner.tsx:103-108`, `src/learner/progress.ts:46-55`), before any answer. `courseAction`
(`src/shell/primaryAction.ts:84-97`) continues the newest `started` record and `pickCourse`
(`src/shell/r1/HomeNext.tsx:25-34`) leads Home with whichever course holds it. One glance at any practice,
in any course, becomes the student's "where you left off". There is no notion of an active course, no
last-meaningful-event, and no per-course resume on Home.

**RC2 — The unit a student looks for is not the unit the navigation offers.** Students look for a *skill*
("binary subtraction", "best-fit"). The navigation offers *topics* with broad titles ("Binary arithmetic",
8 practices, 101 min) and *practices* whose first challenge is often not the named skill (subtraction starts
at "B: divide by 2"; best-fit is challenge 2 of "Fixed partitions"). Challenge labels exist in content
(`question.label`) but appear only as non-link dots (`ChallengeSteps.tsx:17-28`). The only way to a known
skill inside a practice is the hidden ⋯ skip, which was designed as an escape for strong students
(`docs/PEDAGOGY.md:82-87`), not a navigator.

**RC3 — The hierarchy is one-directional and unlabeled.** Each page shows one parent link
(`src/shell/r1/Chrome.tsx:26-33`) and the course page shows none; `/courses/` is a 404; the practice page
shows neither course, chapter nor its own title (`[activity]/page.tsx:32-35`, sr-only `<h1>`). The docs
promise a breadcrumb (`docs/design/information-architecture.md:32`, `redesign-r1/README.md:19`) that was never
built. Browser Back, "up" and "home" are therefore only distinguishable by the logo.

**RC4 — The prominent control jumps past the choice.** On the course page a topic row's quiet "Start →"
goes to the topic's *first* practice (`CourseTopics.tsx:56-60`, `topicRowAction`), not to the topic page
that lists its 8 practices. The topic page's filled button does the same. The listing a student needs to
choose from is reached only through the row *title*, a quieter control, and it sits below the fold at 390.

**RC5 — Labels name the action, not the destination.** "Start", "Continue", "Open course", "Start practice"
are correct but blind: a student cannot predict where they land ("Start → " on *Binary arithmetic* opens
*Binary addition, 0 + 0*). "Today: 0 + 0 → 0 + 1 …" on the topic page describes the first practice only
(`[topic]/page.tsx:33-34`), so a subtraction student reads an addition route.

Not a root cause but a multiplier: at 390 the chapter index is hidden (`r1.module.css:696-698`), the course
page is 2.0–2.2 screens of `<details>`, and the topic page is 2.4 screens of practice cards.

---

## 2. User journeys that currently fail or create friction (step counts)

Source: Reviewer baseline on #670 (fresh browser per journey, DOM-measured). A **tap** is a deliberate press; a
**scroll** is a page scroll needed to reach the next control. UX re-measurement agreed on every count.

| # | Intention / owner example | 390 | 768 | 1280 | Verdict |
|---|---|---|---|---|---|
| A | Don't know where to start (fresh) | 1 tap | 1 tap | 1 tap | Works. "Start here · Place value" above the fold. |
| B | Continue genuine study | 1 tap | 1 tap | 1 tap | Works mechanically; target wrong after any browsing (F). |
| C | ECET111 binary subtraction from Home | 3 taps + 2 scrolls to the practice; **11 taps** to the subtraction step | 3 taps + 1 scroll | 3 taps + 1 scroll | Fails intention 3. |
| D | CPET181 Ch2 Fixed partitions → best-fit | 5 taps + 1 scroll, **2 inside the hidden ⋯ menu** | 5 taps | 5 taps | Fails: best-fit reachable only via skip. |
| E | Direct URL to a deep practice | 0 | 0 | 0 | Lands, but shows only "← Binary arithmetic"; the visit rewrites resume (F). |
| F | ECET111 student opens one CPET181 practice, reopens site | — | — | — | **Home greets with CPET181.** ECET111 reduced to "1 started" in a row below the fold at 390 and 1280. |
| G | /courses/cpet181 → course list | logo only (Home), scroll to list | same | same | No up control on the course page; `/courses/` is 404. |
| G′ | Leave a deep practice to the course | 2 taps (← topic, ← course) | 2 | 2 | Tolerable, but the second hop is labelled with a course code only. |

Friction detail (UX additions):
- C at 390: the Subtraction row on the topic page is at y ≈ 1049 of an 844 px viewport; the "Start practice"
  button (to *Binary addition*) is the only control above the fold. At 1280 the same row is at y ≈ 807 of 800.
- C, the obvious control misleads: the course row's "Start →" opens *Binary addition*; the student then needs
  "← Binary arithmetic" to get back to the listing. This is how the owner reached ~10 steps.
- D: "First-fit · Best-fit · Which is more efficient" is visible twice (topic dots, stage strip) and clickable
  nowhere.
- E at 390: the parent link truncates ("← Fixed …", `r1.module.css:451-463`).
- Home at 1280×800: both "Open course" rows are below the fold (y 792, 939) because the hero takes the
  viewport. At 768 they are above it. So the "second course" is least discoverable on the widest screen.
- F: measured store after the walk: `ecet111 … subtraction-positive: started, attempts 0` and
  `cpet181 … fixed-partitions: started, attempts 0, lastAt newer` → Home leads with CPET181.

---

## 3. Information-architecture problems

**IA1 — Three layers, one of them invisible.** Student words are Course → Chapter → Topic → Practice →
Challenge (`docs/design/information-architecture.md`). Chapters are not in the URL and exist only as `<details>`
groups and an eyebrow. That is fine for URLs (ADR-0002 keeps ids stable) but the *page* must say the chapter.

**IA2 — No catalogue level.** Home is both "what next" and "the course list"; `/courses/` does not resolve.
"Back to the course list" has no target other than Home, and Home's list is below the fold at 390 and 1280.

**IA3 — Topic titles are categories, practice titles are the real objectives.** 65 topics; practices per topic
1–8; titles such as "Binary arithmetic", "Processes, schedulers and policies", "Magnetic tape" name a topic,
while "Exercise: 15 − 4", "Best-fit" (a label), "Round robin" name the thing a student wants. Every list that
offers a *topic* must therefore show what is *inside* it.

**IA4 — The challenge is the smallest addressable idea but the practice is the smallest safe entry.**
Variants are index-stable across a practice's questions (#141), so questions are a chain on one number set;
question k may lean on k−1 (16 back-references, 5 real gaps in the inventory). A navigator must respect this:
link challenges for *finding*, enter at the practice (or at a content-declared safe entry), never at an
arbitrary k.

**IA5 — One resume, no owner.** Resume is a single global pointer (newest `started`), not "per course, with
one active course". A two-course student has no visible second thread.

**IA6 — Guidance and permission are the same control.** The filled button is both "we recommend this" and
"this is the only big target". Other paths exist but read as second-class ("Start →" in 15 px). The owner's
"guide, but do not trap" asks for a recommended path that is *marked* as recommended, beside paths that are
*visibly* legitimate.

**IA7 — Hidden skip is doing navigation work.** ⋯ → "Skip to next question" is the only route to a known
challenge. It records `skippedQuestions`, shows "skipped ahead" on the map, and gates on an `independent`
practice. A student wanting best-fit is neither skipping nor strong; they are navigating.

---

## 4. Proposed navigation model

### 4.1 Hierarchy (what each level answers, what it lists)

| Level | Route | Answers | Lists | Primary (filled) | Up control |
|---|---|---|---|---|---|
| Home | `/` | What should I do now? | One "next" panel per **active course**; the catalogue below | Continue / Start here | — |
| Courses | `/courses/` (new, thin) | Which course? | Each course with its own Continue / Start | none (one quiet action per row) | ← Home (logo) |
| Course | `/courses/<c>/` | Which chapter and topic? | Chapters → topics, each topic with its practice names in one muted line | the recommended topic | **← Courses** |
| Topic | `/courses/<c>/<t>/` | Which practice? | All practices with their challenge labels | the recommended practice, captioned "Recommended" | ← course (code + short title) |
| Practice | `/courses/<c>/<t>/<a>/` | The work | Challenge strip; a compact **topic navigator** (other practices) behind one disclosure | Check / Next challenge | ← topic |

Rules that make this "guide, not trap":
1. **One filled button per view stays** (R1 §1), but it carries a caption *Recommended next* (en/ar), and every
   other unit in the list has a quiet action of equal reachability. Recommended ≠ required.
2. **Every level can be left in one tap to its parent, and in one tap to Home** (logo). No level is a dead end.
3. **Course page topic rows link to the topic page, not into the first practice**, when the topic has more
   than one practice. The row action reads "Open topic →" (or "Continue →" with the practice name).
   Single-practice topics keep "Start → " + practice name. (RC4)
4. **Labels name the destination** (RC5): "Start · Binary addition", "Continue · Fixed partitions, challenge 2",
   "Open · ECET 111". Pattern: *verb · object*, object truncated with an ellipsis at 390, never the verb.

### 4.2 Where am I / Up / Home: three distinct controls

- **Browser Back** is untouched; nothing in the shell calls `history.back()` (keep `Chrome.tsx` as a fixed
  parent link, as today).
- **Up** stays in the top bar as "← parent", one level, as built. On the course page the parent becomes
  "← Courses" (`/courses/`). At 390 the label is the *short* parent name (topic title, course code).
- **Where am I** is a **location line under the top bar** on topic and practice pages:
  `ECET 111 · Chapter 1 · Binary arithmetic` — each segment a link; the last segment is the current topic on a
  practice page (on the topic page it is plain text). This revives the breadcrumb the R1 docs promised and the
  code dropped. At 390 it shows the two nearest segments and collapses the rest into "…" (which opens the
  full trail inline). It replaces the eyebrow on the topic page; on the practice page it is new and sits
  above the challenge strip, with the **practice title visible** (today sr-only).
- **Home** is the logo only (as now) plus the Courses link. Home never acts as "up".

### 4.3 Topic practice navigator (and why not a "challenge menu")

Serve "practise X" at the two levels where X lives:

**(a) Find the practice** — the topic page lists every practice as a row *with its challenge labels in one
muted line*: "Subtraction by 2's complement · Divide by 2 → Read off → 1's complement → +1 → Add → …".
The course page topic row gets the practice *titles* in one muted line ("Binary addition · 1's and 2's
complement · Subtraction by 2's complement · Exercise 15 − 4 · …", truncated with "+3 more" at 390). This
alone makes journey C a 3-tap scan with no misleading jump, and journey D a visible "Best-fit is in Fixed
partitions, challenge 2".

**(b) Move between practices from inside one** — on the practice page, a disclosure "Practices in this topic
(3 of 8)" under the location line opens the same list as the topic page, with the current one marked. It is
collapsed by default (the stage keeps the fold; R1 §2 "no introduction"), and it is a navigator, not a stage
control: it never writes progress and does not touch the runner state. Enter via the navigator = enter at
challenge 1 (or at a *declared entry*, §8).

**Challenges are shown and linked for finding, not for jumping.** A challenge label in the navigator deep-links
to its practice page with `#q=<label>` only if content declares that question an entry (§8); otherwise the row
is plain text and the practice opens at challenge 1 with the labels visible, so the student knows best-fit is
"two steps in". The ⋯ skip stays exactly as specified in PEDAGOGY (gated, recorded); the navigator never
replaces it, and after the change ⋯ is no longer the only route to a known skill (Reviewer's gate).

### 4.4 Find X: a course-level filter, not a site search

Justified: topic titles are categories (IA3) and 148 practices across 14 chapters are too many to scan on a
phone (2+ screens). Cheap: `CourseTopics` is a client component that already receives the whole course object
(`src/app/courses/[course]/page.tsx:36`), so a text filter costs no payload and no index. Proposal: a
"Find a practice" field at the top of the course page's chapter map, matching topic titles, practice titles and
challenge labels (case- and diacritic-insensitive; Arabic later when content labels exist). Typing "best"
narrows the map to Chapter 2 › Fixed partitions › **Best-fit** (challenge 2 of Fixed partitions); typing "sub"
lists the five subtraction practices. Not a global search; nothing cross-course; no results page.

### 4.5 Recommended-next

Keep the resolver (`primaryAction.ts`) as the single source of "recommended": first unfinished in course order,
else continue the most recent *meaningful* practice (§7). Mark it as a recommendation in the UI (caption),
never hide alternatives behind it, and on the practice summary offer three quiet ways out beside the filled
"Next": *Back to topic*, *Another practice in this topic* (opens the navigator), *Course map*.

---

## 5. Alternatives considered

| Alternative | Keep / reject | Why |
|---|---|---|
| **Global "All activities" menu / mega-list** (every practice in one navigable tree) | Reject | 148 rows; dense dashboard feeling (charter "avoid dense dashboards"); reintroduces the syllabus wall #110 removed. The filter (§4.4) gives the same reach without the wall. |
| **Challenge-level routes** (`/…/<activity>/<question>/`) | Reject for now | Questions are a chain on one variant set (#141); entry at k must restate k−1. The inventory shows 5 real gaps today and no tooling to keep future ones out. Prefer a content-declared *entry* flag plus `#q=` (§8), which keeps the static route set unchanged (ADR-0008 pre-rendering). |
| **Hamburger / drawer with the whole course tree on phones** | Reject | Hides the hierarchy behind a second gesture; the owner asked for calm, not an app shell. The location line + navigator disclosure give the same reach in place. |
| **Sidebar chapter index at 768** (today only ≥ 900) | Keep as an option | Cheap, but at 768 portrait the main column drops to ~470 px; prefer a horizontal chapter strip (§6). |
| **"Courses" link in the top bar at every width** | Reject | A fourth top-bar item at 390 (logo, back, EN|عربي, profile) crowds the bar; the course page's "← Courses" plus the Home catalogue cover the need. Put "Courses" in the profile menu as a fallback. |
| **Resume by "last visited page"** (store the URL) | Reject | Turns browsing into study (RC1 again) and would need a new store key. Resume must be derived from *answers*, not visits. |
| **Per-course Home panels for every course** | Partly keep | Show a panel for the active course and a one-line "Continue" on the other course's row; two full hero panels would push the catalogue below the fold again. |
| **Replace ⋯ skip with the navigator** | Reject | Different purpose (escape for strong students, recorded, gated). Both stay; the navigator removes the pressure on skip. |
| **Topic "Today:" line from all practices** | Keep, reworded | "Today" implies one sitting; for multi-practice topics show "Practices: A · B · C" instead, and keep "Today: …" for single-practice topics. |
| **Breadcrumb in the top bar** (R1 docs' original idea) | Reject at 390, keep the idea below the bar | The bar already truncates the back label at 390; a location line of its own has room and can wrap. |

---

## 6. Mobile and desktop behaviour at 390 / 768 / 1280

Breakpoints already in the system: ≤640 (phone), <900 (no aside), ≥900 (aside). Proposal adds no new tokens.

### 390 — practice page, direct entry (journey E)
```
┌──────────────────────────────────────┐
│ ▣ CET Learn   ← Binary arithmetic   EN|عربي ◯ │  top bar: unchanged (logo = Home, ← = Up)
├──────────────────────────────────────┤
│ ECET 111 › Ch 1 › Binary arithmetic  │  location line (links); "…" if > 2 segments fit
│ Subtraction by 2's complement        │  practice title, visible (today sr-only)
│ ▸ Practices in this topic (3 of 8)   │  disclosure, collapsed; opens the navigator list
│ ● ● ○ ○ ○ ○ ○  Challenge 3 of 7 · Add│  strip as today
│ ┌──────────────────────────────────┐ │
│ │ Mr. Mohanad  "We'll do this one  │ │  tutor strip as today
│ │ step at a time …"                │ │
│ └──────────────────────────────────┘ │
│ A − B = 13 − 9.  Now add A and the   │  prompt; the context restated by content (§8)
│ 2's complement of B: 1101 + 0111     │
│ [ column addition … ]                │
│ [ Check step ]            Hint   ⋯   │
└──────────────────────────────────────┘
```
Cost on the fold: +2 lines (location + title) ≈ 48 px; the disclosure is one line. The first challenge still
starts in the first screen at 844 px (today the stage head starts at ~140 px).

### 390 — topic page with the navigator rows
```
│ ▣ CET Learn   ← ECET 111       EN|عربي ◯ │
│ ECET 111 › Chapter 1                  │
│ Binary arithmetic                     │
│ Practices: addition · complements ·   │  replaces "Today: 0+0 → 0+1 …" for multi-practice topics
│ subtraction · exercises · 8-bit       │
│ [1000 + 1000 → 10000]                 │  preview board, unchanged
│ (tutor line)                          │
│ ┌ Recommended next ────────────────┐  │  caption makes the filled button a recommendation
│ │ [ Start · Binary addition  → ]   │  │
│ │ 7 short challenges · about 12 min│  │
│ └──────────────────────────────────┘  │
│ All practices in this topic           │
│ 1  Binary addition          Start →   │  compact rows: 2 lines each (today 4-line cards, 130 px)
│    0+0 · 0+1 · 1+1 · Column by column…│
│ 2  1's and 2's complement   Start →   │
│    1's · 2's · Check                  │
│ 3  Subtraction by 2's compl.Start →   │
│    Divide · Read off · 1's · +1 · Add…│
│ 4  Exercise: 15 − 4         Start →   │
│ …                                     │
```
With 2-line rows (≈ 64 px) all 8 practices fit in ~1.3 screens instead of 2.4; the subtraction row lands at
y ≈ 700, inside the first viewport.

### 768 — course page: chapter strip instead of the hidden aside
```
│ ▣ CET Learn   ← Courses                      EN|عربي ◯ Guest │
│ ECET 111                                                      │
│ Introduction to Digital System Design I                        │
│ [ Find a practice …                                 ]          │  §4.4 filter
│ ① Digital ② Boolean ③ K-Map ④ Combinational ⑤ Sequential      │  horizontal chapter strip, scrollable,
│ ▼ 1 · Digital Systems and Binary Numbers      Not started      │  replaces the ≥900 aside below 900
│   Place value                 5 challenges · 15 min  [Start · Place value →]  ← filled, "Recommended"
│   Number-base conversions     3 practices · 29 min   Open topic →
│     Decimal→binary→octal→hex · Hex digits · Exercise 88 and 73
│   Binary arithmetic           8 practices · 101 min  Open topic →
│     Binary addition · 1's and 2's complement · Subtraction by 2's … +5
│ ▸ 2 · Boolean Algebra and Logic Gates          Not started     │
```

### 1280 — course page: aside keeps the chapter index; practice page gets the location line
```
│ ▣ CET Learn   ← Courses                                            EN|عربي ◯ Guest │
│ ECET 111                                   │ CHAPTERS                                │
│ Introduction to Digital System Design I    │ ● 1 · Digital Systems …  (here)         │
│ [ Find a practice … ]                      │ ○ 2 · Boolean Algebra …                 │
│ ▼ 1 · …                                    │ ○ 3 · K-Map …                           │
│   Binary arithmetic  Open topic →          │ (tutor, as today)                       │
│     Binary addition · 1's and 2's … +5     │                                         │
```
Practice page at 1280: location line + visible title sit in the main column above the strip; the tutor column
is unchanged (`point_left` ≥ 1200). The navigator disclosure stays in the main column (not the tutor column) so
the tutor never looks like a menu.

Responsive rules (no new tokens): location line wraps, never truncates mid-word; at ≤640 it shows the last two
segments plus "…"; 44 px targets on every navigator row; `aria-current="page"` on the current practice in the
navigator; the disclosure is a `<details>` so it works without JS (same pattern as the chapter map).

---

## 7. Impact on progress and resume state

### 7.1 Meaningful progress (definition)
A practice has **meaningful progress** when at least one of these has happened in it:
`attempts > 0` (`recordAttempt`), a `completedQuestions` entry (`completeQuestion`), or `explained`
(`markExplained`). Opening the page is not progress. Skipping a question is not progress (it is recorded, but it
makes nothing "current"). Browsing Home, Courses, course or topic pages writes nothing (already true).

Consequence for writers: `startActivity` should **not** run on mount. It can run lazily on the first attempt
(the attempt writer already creates the record if absent, `progress.ts:67`), which removes the mount write
without changing the stored shape. Records already stored as `started, attempts 0, no completedQuestions,
no explained` are treated as *visited only* by the derived rules below; **no storage format change, no
migration** (ADR-0005 stays at v1). The "revive a skipped practice" branch (`progress.ts:49`) moves to the same
first-attempt moment.

### 7.2 Resume target rules
- **Per course** (`courseAction`): Continue = the practice with meaningful progress, status `started`, newest
  `lastAt`; else Start = first topic not completed; else Review. A visited-only practice never becomes Continue.
- **Active course** (`pickCourse`): the course whose newest meaningful event is most recent. Opening another
  course's practice without answering does not change it. Tie / no meaningful progress anywhere → the first
  course in the catalogue (as today).
- **Home** shows one panel for the active course and, on every *other* course row, its own one-line
  per-course action ("Continue · Fixed partitions" / "Start · Hardware categories"), so the second thread is
  visible without a second hero.
- **Direct entry** (journey E) does not rewrite resume until the student answers. Then it does, in that
  course only.
- **Explicit switch** stays implicit: there is no "set active course" control; answering in a course makes it
  active. (Simplest rule, matches "no account, no settings sprawl".)

Journey F after this: ECET111 student opens a CPET181 practice, looks, leaves → Home still greets with
ECET111; the CPET181 row shows "Start · …". If they answer one CPET181 challenge, Home greets with CPET181 and
the ECET111 row shows "Continue · Subtraction by 2's complement, challenge 3". Both are honest.

### 7.3 Tests this needs
Unit: `primaryAction.test.ts` (visited-only never Continue), `HomeNext.test.tsx` (active-course rule, per-row
actions). E2E (`e2e/smoke.spec.ts`): journey F at 390 and 1280; Continue still resumes at the first unfinished
challenge (existing test at l.311 must keep passing since `completedQuestions` is untouched).

---

## 8. Impact on direct-entry safety

Content inventory (#670): 148 practices; every prompt carries its own numbers; 16 back-referencing questions,
of which **5 are real gaps** (`sub.q.add`, `subx.q.add`, `subn.q.add`, `sb8p.q.add`, `sb8n.q.add`: "Now add A
and the 2's complement of B" with A and B not on screen). The other 11 restate their context.

Rules this proposal adds:
1. **The practice stays the unit of entry.** Direct URL, navigator and resume all land on a practice page;
   the runner starts at challenge 1 unless a `started` record resumes it (as today).
2. **Every practice page shows its context on entry**: location line (course · chapter · topic), the practice
   title, the challenge strip with labels. That answers "where am I" for a shared link at 390 (Reviewer gate).
3. **A continuation shows its own context in the prompt** (question-context rule #568/#624): content restates
   the chain's givens in the question that leans on earlier ones ("A − B = 13 − 9; the 2's complement of
   B is 0111. Now add …"). The Content Engineer's fix for the five gaps is content-only and precedes any
   challenge-level entry. The existing guard in `src/content/**` tests should also flag the wording cues the
   inventory used ("now", "next", "same", "earlier") unless the prompt names the quantity it refers to.
4. **Declared entries, not arbitrary k.** Content may mark a question `entry: true` meaning "self-contained;
   may be opened directly". The navigator deep-links only those (`#q=<id>`, read by the runner the way
   `?review=1` is, `ActivityRunner.tsx:37-41`); the runner shows a one-line **"Steps before this one"** strip
   listing the earlier challenge labels as plain text (never their answers) so the student knows what the chain
   assumed. For the owner's two examples: *Best-fit* (`fx.q.best`) qualifies today — the memory map and jobs
   are in its spec; the subtraction "Add" step qualifies after the content fix. Without the flag a challenge is
   findable but entered at challenge 1 with the labels in view.
5. **Entering via a declared entry never marks earlier challenges done**; `completedQuestions` stays honest,
   so the practice does not complete until the earlier steps are done (same rule as skip, without the
   "skipped ahead" badge, because nothing was skipped: the student chose an entry).

---

## 9. Low-risk quick wins

Each is one small PR, no storage change, no new route except QW3; all new strings go through the shared Arabic
map (ADR-0011 §3; `scripts/build-l10n.mjs`) and need Arabic from the owner's package.

| # | Change | Files | Fixes |
|---|---|---|---|
| QW1 | Course-page topic row action: "Open topic →" (to the topic page) when the topic has > 1 practice; "Start · {practice}" otherwise | `src/shell/r1/CourseTopics.tsx` (`quietAction`), `primaryAction.ts` (`topicRowAction`) | RC4, C |
| QW2 | Labels name the destination: "Start · {title}", "Continue · {title}", "Open · {code}"; aria-labels already do this, make the visible text match | `CourseTopics.tsx`, `TopicNext.tsx`, `HomeNext.tsx:126`, `ActivitySummary.tsx` | RC5 |
| QW3 | "← Courses" up link on the course page; thin `/courses/` page reusing Home's course list | `src/app/courses/[course]/page.tsx`, new `src/app/courses/page.tsx` | G, IA2 |
| QW4 | Practice page: visible title + location line (course code · chapter · topic as links) above the strip | `[activity]/page.tsx`, `Chrome.tsx` or a new `LocationLine` in `src/shell/r1/` | E, RC3 |
| QW5 | Topic rows (topic page) show their challenge labels in one muted line; course rows show practice titles (+N more) | `TopicNext.tsx:55-75`, `CourseTopics.tsx` TopicRow `route` | RC2, C, D |
| QW6 | Multi-practice topics: "Practices: …" line instead of "Today: …" built from practice 1 only | `[topic]/page.tsx:33-34` | RC5 |
| QW7 | "Recommended next" caption over the filled button on course and topic pages | `PrimaryAction.tsx` (optional caption prop) | IA6 |
| QW8 | Content: restate A − B in the five `*.q.add` prompts; extend the context guard | `src/content/ecet111/chapter1/binary-arithmetic.ts`, content tests | §8 gap |
| QW9 | Home: per-course one-line action on each course row ("Continue · …" / "Start · …") | `HomeNext.tsx:109-130` | F (visibility half) |

Order inside quick wins: QW8 (content, independent) ‖ QW1+QW2 ‖ QW3 ‖ QW4 ‖ QW5+QW6 ‖ QW7 ‖ QW9.

---

## 10. Structural changes

| # | Change | Scope | Depends on |
|---|---|---|---|
| S1 | **Meaningful-progress resume model** (§7): no write on mount; derived "visited-only" rule; active-course rule; per-course Continue on Home | `progress.ts`, `ActivityRunner.tsx:103-108`, `primaryAction.ts`, `HomeNext.tsx`, tests | QW9 for the UI half |
| S2 | **Topic navigator on the practice page** (§4.3b): collapsed `<details>` under the location line listing the topic's practices with labels, current marked | new `src/shell/r1/TopicNavigator.tsx` reused by `TopicNext` and the activity page; CSS in `r1.module.css` | QW4, QW5 |
| S3 | **Declared entries** (§8.4): `entry?: boolean` on questions in the schema, `#q=` handling in the runner, "Steps before this one" strip, navigator deep-links | `src/content/schema.ts`, `runnerReducer.ts` (`initialRunnerState`), `ActivityRunner.tsx`, content tests, Content Engineer flags the first entries | QW8, S2, Pedagogy sign-off |
| S4 | **Find a practice** filter on the course page (§4.4) | `CourseTopics.tsx` (client-side filter over the course object), Arabic placeholder string | QW5 (labels in the rows) |
| S5 | **768 chapter strip** replacing the hidden aside below 900 px (§6) | `CourseTopics.tsx` `ChapterIndex` variant, `r1.module.css:644-698` | none |
| S6 | **E2E navigation suite**: journeys C, D, E, F, G at 390 and 1280 (Pixel 7 + Desktop Chrome projects exist) | `e2e/navigation.spec.ts` | each of the above lands behind a test |

Not proposed: new storage keys, challenge-level routes, a drawer, a global search, any change to grading,
tutor engine or stage internals (#110 constraints).

---

## 11. Recommended implementation order, with dependencies

```
Phase 0 (content, parallel)   QW8 restate the 5 gaps + extend the context guard        [Content → Reviewer]
Phase 1 (quick wins, 1 PR each, UI Engineer)
   QW1 + QW2 destination labels ──┐
   QW3 ← Courses + /courses/      ├─ all need Arabic strings via the shared map (package addendum from owner)
   QW4 location line + title     ─┤
   QW5 + QW6 label lines          │
   QW7 Recommended caption        │
   QW9 per-course row actions    ─┘  (visual half of S1; safe before S1)
Phase 2 (progress model)          S1 meaningful progress + resume rules + unit tests + e2e journey F
                                  ← depends on nothing above, but QW9 first makes the change visible
Phase 3 (navigator)               S2 topic navigator on the practice page   ← QW4, QW5
Phase 4 (question context)        S3 declared entries + #q= + "steps before" strip
                                  ← QW8 merged, S2 merged, Pedagogy approves the strip wording,
                                    Content flags fx.q.best and the subtraction "Add" steps first
Phase 5 (find)                    S4 find-a-practice filter                 ← QW5
Phase 6 (tablet)                  S5 chapter strip at <900                  ← independent; after S4 so the
                                                                              filter and strip share a header
Throughout                        S6 e2e navigation suite grows with each phase (C, D, E, F, G at 390/1280)
Arabic                            every new label lands in docs/localization/ar/source-texts.ar.json first
                                  (ADR-0011 §3: build fails rather than ships English silently)
```

Acceptance against the Reviewer's gates: Freedom (QW3, QW4), Direct entry (QW4, QW8, S3), Hierarchy (QW4),
Resume correctness (S1 + e2e F), Structural not moved buttons (S2/S3: ⋯ skip no longer the only route to
best-fit or to the subtraction step), Arabic strings and no storage format change (all phases).

Expected step counts after Phases 1–3 (same measuring rules as §2): C = 3 taps, 0–1 scroll, subtraction step
reachable by its labelled entry in 4 taps (after S3); D = 4 taps (Open CPET 181 → Chapter 2 → Fixed partitions
→ Start · Fixed partitions) with best-fit visible as "challenge 2" and, after S3, a direct entry; E shows
course · chapter · topic · title at 390; F never switches course on a look; G = 1 tap at every level.
