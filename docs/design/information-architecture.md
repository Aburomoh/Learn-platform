# Information architecture: Course → Topic → Activity (R1-1, #111)

Product recommendation for epic #110 (items 1–4, 10, 12). Pedagogy (#112) and UX (#113) may change it;
the Technical Lead settles conflicts.

## Names students see
| Content model | Student word | Page | Answers |
|---|---|---|---|
| Course | Course ("ECET 111") | Course page | Which chapter and topic next? |
| Module | Chapter | Section on the course page, no page of its own | — |
| Topic | Topic | Topic page | What am I learning, what do I do now? |
| Activity | Practice | Activity page | The work itself |
| Question | Challenge | Step inside the practice | — |

Each layer says something the others do not. The course page lists topics, not activity details. The
topic page lists challenges, not a one-row "Activities" list (most topics have one practice; with more
than one, show one row per practice, each with its own button).

## Primary action (one per page)
| Local progress (existing store) | Button | Goes to |
|---|---|---|
| No record | **Start practice** | Challenge 1 |
| `started` | **Continue** | First unfinished challenge |
| `completed` | **Next topic** (primary), Review (secondary link) | Next topic in course order; Review restarts at challenge 1 |

The button is a real button, not a clickable card. The same rule picks the button on every page:
- **Home:** one course → "Continue ECET 111" (most recently touched practice) or "Open ECET 111".
- **Course page:** the same Continue/Start at the top; each topic row shows a status and one small button.
- **Topic page:** the button follows the table above.

## Topic page: keep, move, collapse
Keep, in this order: breadcrumb (small: course · chapter), topic title, one "Today:" line naming the
challenges in order, a visual preview string from content (e.g. 45₁₀ → 101101₂ → 55₈ → 2D₁₆), the
tutor placeholder line, the primary button, then one muted line "10 min · 4 short challenges", then
challenge progress (one dot per challenge: done / current / not started).
Collapse: "What you'll practise" (the objectives), closed by default. Remove from this page: topic
summary paragraph if it repeats the "Today" line.
Move out: DEMO goes to one subtle site-wide indicator; Guest and Settings go to a profile menu.

## Activity page
The first challenge is the first thing on screen; no introduction. Header shows "Challenge 2 of 4"
dots. The end summary offers the same next action (Next topic / Review).

## Returning progress, local store only
Activity `status` already exists. "Continue to the first unfinished challenge" and the dots need one
more fact: which challenges are finished. Add an optional `completedQuestions` list per activity
(no version bump, no new data leaves the device), and let the runner start at the first unfinished
one. No mastery labels.

## Content additions
Optional `preview` on a topic (the visual string) and a short `label` on a question (for the dots
and the "Today" line). Both are display text; no new behaviour.

## Tasks (milestone R1, not `ready` until #113 is accepted)
#116 content preview + labels · #117 completed challenges · #118 primary-action resolver ·
#119 runner resume · #121 topic page · #122 course page · #123 home · #124 activity page ·
#125 DEMO indicator + profile menu.
