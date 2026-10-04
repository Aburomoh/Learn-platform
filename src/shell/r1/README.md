# R1 shared shell components

The building blocks of the redesigned pages (`docs/design/redesign-r1/README.md` §10). Pages compose
these and carry no styling of their own; everything is drawn from the design tokens.

| Component | Answers | Notes |
|---|---|---|
| `PageHeading` | Where am I · What am I learning | Eyebrow (`--brand`, 13 px bold uppercase), one `h1` at `--text-display`, one route line. |
| `PreviewBoard` | What will it look like | Renders a topic's `preview` string as tiles on a sunken board; `role="img"` read out in words ("53 base 10, then …"); bases become `<sub>`. `size="sm"` for rows. |
| `PrimaryAction` | What do I do next | One filled link-button per view (48 px, full width on phones), optional quiet secondary, effort cue. Takes `{ label, href }` from the primary-action resolver. `size="row"` for a topic row. |
| `ChallengeSteps` | How far am I | One marker per challenge: done (filled + check), current (ring, `aria-current="step"`), not started (hairline ring); each with hidden text. `stepsFrom(questions, completedIds)` builds the states. |
| `TopBar` | — | The mark (`product.brand.markSrc`) and the name from config, an optional quiet back link, and the profile button. No breadcrumb trail. |
| `ProfileMenu` | Who am I here | Disclosure: person icon (+ "Guest" from 641 px). Panel: what Guest means, Appearance (Light · Dark · Match device), Settings. Escape or a click outside closes it. |
| `Footer` | — | Facts line: amber dot + "Demo content" (only for demo content), "Optional practice, not graded", "Progress stays in this browser". |
| `TopicRow` | Which topic next | Plain surface: optional visual (`<PreviewBoard size="sm" bare />`, hidden on phones), title, route, status (with a check when completed), and one action: filled for the next topic, quiet for the rest. The row is never the click target. |
| `TutorCard` (`src/tutor/ui`) | — | Monogram disc from the tutor's name (sm 40, md 56, lg 88 px) with one line in a soft bubble; with `portrait` (`product.brand.tutorPortrait`) it shows `pose` (default neutral; `welcome` on home and the course/topic rails for a first visit via `HomeNext` and `CourseTutor`): the waist-up pose in a 168 × 224 box above the bubble from 900 px, the head crop in the disc below. The line is passed in from the tutor catalog. |

Rules that apply to all of them:
- `--brand` is used as text only at 13 px bold or larger.
- Any time figure says "about" and comes from authored minutes (`effortCue`), never from tracked time.
- Colour is never the only signal; every state also has a shape or text.
- No tutor copy lives here: tutor text comes from the engine and catalog.

Every page uses these through `PageFrame` (top bar, readable main column with an optional right column, footer). The old `Shell` and its top bar are gone (#125): the demo notice is the footer's amber dot, and Guest / Settings live in the profile menu.
