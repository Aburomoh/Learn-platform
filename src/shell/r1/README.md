# R1 shared shell components

The building blocks of the redesigned pages (`docs/design/redesign-r1/README.md` §10). Pages compose
these and carry no styling of their own; everything is drawn from the design tokens.

| Component | Answers | Notes |
|---|---|---|
| `PageHeading` | Where am I · What am I learning | Eyebrow (`--brand`, 13 px bold uppercase), one `h1` at `--text-display`, one route line. |
| `PreviewBoard` | What will it look like | Renders a topic's `preview` string as tiles on a sunken board; `role="img"` read out in words ("53 base 10, then …"); bases become `<sub>`. `size="sm"` for rows. |
| `PrimaryAction` | What do I do next | One filled link-button per view (48 px, full width on phones), optional quiet secondary, effort cue. Takes `{ label, href }` from the primary-action resolver. `size="row"` for a topic row. |
| `ChallengeSteps` | How far am I | One marker per challenge: done (filled + check), current (ring, `aria-current="step"`), not started (hairline ring); each with hidden text. `stepsFrom(questions, completedIds)` builds the states. |

Rules that apply to all of them:
- `--brand` is used as text only at 13 px bold or larger.
- Any time figure says "about" and comes from authored minutes (`effortCue`), never from tracked time.
- Colour is never the only signal; every state also has a shape or text.
- No tutor copy lives here: tutor text comes from the engine and catalog.

Still to come in this folder (#134): `TopBar`, `Footer`, `TopicRow`, `ProfileMenu`; `TutorCard` goes in `src/tutor/ui`.
