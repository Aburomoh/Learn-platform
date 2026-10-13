# Arabic batch for the new navigation labels (#676, epic #670)

**Status: REVISED per the owner's decisions of 2026-10-13 (#697), for final approval. Nothing here ships until the owner approves it.** The real strings are in the draft PR #702's package files so QA can render them. Content Engineer, 2026-10-13, main @ f53dec5.

How to read it: `key · English · proposed Arabic · notes`. A row marked **decide** needs the owner. Every `{slot}` is kept exactly. Digits are Western. The rules are the owner's (REQUIREMENTS.md): Modern Standard Arabic, slightly conversational; English technical terms stay English and are LTR-isolated; no machine translation. Terms follow `TECHNICAL_GLOSSARY_AR.md`; "Course", "Chapter" and "Topic" stay English (owner, 2026-10-13, #676), written with the `الـ` prefix as the approved package does («الـ Processors»). Address is the masculine imperative, as the approved package does (جرّب، ابحث).

How it ships after approval: one PR appends these entries (id = `ui.<key>`, type `ui-label`, no course, so they go to the shared map) to `source-texts.json` and `source-texts.ar.json`; `scripts/build-l10n.mjs` builds the maps; `localization.ar.test.ts` keeps the pair in step. Until then the app shows the English.

What is already covered: all 229 non-`ui.*` catalog keys have Arabic in the approved package, and four `ui.stage.*` keys and `ui.summary.hints.zero` match approved strings. What is missing is listed below: 30 labels from the navigation PRs (sections 1–3), 13 older component strings (section 4), 5 from the tutor engine (section 5), 4 changed titles (section 6).

## 1. Where am I, and the way up (#674, PR #689)

| Key | English | Proposed Arabic | Notes |
|---|---|---|---|
| `ui.nav.here` | You are here | أنت هنا | Accessible name of the location line. Auditor proposal on #676. |
| `ui.nav.show-path` | Show the whole path | اعرض المسار كاملًا | The "…" button on phones. |
| `ui.nav.all-courses` | All courses | كل المقررات | Owner decision 1: المقررات, no hybrid form. |
| `ui.nav.courses-moved` | The courses are listed on the home page. | المقررات معروضة في الصفحة الرئيسية. | Owner decision 1. |
| `ui.nav.go-courses` | Go to the courses | اذهب إلى المقررات | Owner decision 1. |

The location line itself («ECET 111 · Chapter 1 · Binary arithmetic») needs no string: the separators and the English words stay as they are. Course codes stay Latin, LTR-isolated.

## 2. Labels that name their destination (#673, PR #685)

`{title}` is a practice or topic title. Titles are navigation text, which is not in the approved package (AUDIT.md §3, the owner's scope decision is open), so a title shows in English inside the Arabic frame, LTR-isolated.

| Key | English | Proposed Arabic | Notes |
|---|---|---|---|
| `ui.action.start` | Start · {title} | ابدأ · {title} | |
| `ui.action.continue` | Continue · {title} | تابع · {title} | The package uses واصل and المتابعة in running text; a button label is shorter. |
| `ui.action.review` | Review · {title} | راجع · {title} | |
| `ui.action.next-topic` | Next topic · {title} | الـ Topic التالي · {title} | "Topic" stays English (approved package). |
| `ui.action.open-topic` | Open topic | افتح الـ Topic | |
| `ui.action.recommended` | Recommended next | الخطوة التالية المقترحة | Owner decision 2. |
| `ui.topic.practices` | Practices: {titles} | التمارين: {titles} | Owner decision 2: تمرين / تمارين. Titles stay English. |
| `ui.row.more` | +{n} more | أخرى: {n} | Label:value form (owner decision 4); avoids a leading + in RTL. |

## 3. The kind of a practice, in plain words (#673, PR #685)

Shown on a practice row before entry: what the student will do.

| Key | English | Proposed Arabic | Notes |
|---|---|---|---|
| `ui.kind.base-to-decimal` | Step-by-step sum | جمع خطوة بخطوة | The place-value sum. |
| `ui.kind.bit-grouping` | Group the bits | جمّع الـ Bits | Bit stays English (glossary). |
| `ui.kind.circuit-predict` | Read the circuit | اقرأ الدائرة | |
| `ui.kind.column-addition` | Add column by column | اجمع عمودًا عمودًا | |
| `ui.kind.cpu-schedule` | Draw the schedule | ارسم مخطط الجدولة | The Gantt chart. |
| `ui.kind.derivation` | Step-by-step derivation | اشتقاق خطوة بخطوة | |
| `ui.kind.device` | Read the device | اقرأ المكوّن | Owner decision 3: generic circuit component («المكوّن»). The course concept Device would stay «Device (جهاز)»; no label here means that. |
| `ui.kind.expression` | Write the expression | اكتب التعبير | Expression (تعبير), glossary. |
| `ui.kind.kmap` | K-map | K-map | English only (glossary). |
| `ui.kind.memory-map` | Memory map | خريطة الذاكرة | Memory (الذاكرة), glossary. |
| `ui.kind.multiple-choice` | Choose the answer | اختر الإجابة | |
| `ui.kind.numeric` | Type the number | اكتب الرقم | |
| `ui.kind.place-value` | Place value | القيمة المكانية | Glossary. |
| `ui.kind.repeated-division` | Step-by-step division | قسمة خطوة بخطوة | |
| `ui.kind.state-diagram` | State diagram | مخطط الحالات | State (حالة), glossary. |
| `ui.kind.timing` | Timing diagram | مخطط التوقيت | |
| `ui.kind.truth-table` | Fill the table | املأ الجدول | Truth table (جدول الحقيقة) names the object; the action is "fill the table". |

## 4. Older component strings found missing while collecting (not from the nav PRs)

These are on main already and have no Arabic, because the pre-catalog versions held `${…}` expressions that could not be translated (TRANSLATION_REVIEW_NOTES.md). Owner decision 4: label:value forms, the same string for `one` and `other`, so no Arabic number agreement is needed.

| Key | English | Proposed Arabic | Notes |
|---|---|---|---|
| `ui.summary.line` | {activity}: {challenges}, {attempts}, {hints}. | {activity}: {challenges}، {attempts}، {hints}. | Arabic comma. |
| `ui.summary.challenges.one` | {n} challenge | التحديات: {n} | |
| `ui.summary.challenges.other` | {n} challenges | التحديات: {n} | The package already says التحدي. |
| `ui.summary.attempts.one` | {n} attempt | المحاولات: {n} | |
| `ui.summary.attempts.other` | {n} attempts | المحاولات: {n} | |
| `ui.summary.hints.one` | hints used on {n} challenge | التحديات التي استُخدمت فيها تلميحات: {n} | Zero form is already approved: «لم تحتج إلى تلميحات». |
| `ui.summary.hints.other` | hints used on {n} challenges | التحديات التي استُخدمت فيها تلميحات: {n} | |
| `ui.numeric.decimal` | digits 0 to 9 | أرقام من 0 إلى 9 | |
| `ui.numeric.decimal.signed` | digits 0 to 9, a leading minus sign | أرقام من 0 إلى 9، وإشارة ناقص في البداية | |
| `ui.numeric.decimal.places.one` | digits 0 to 9, and up to {n} decimal place after the point | أرقام من 0 إلى 9. أقصى عدد للمنازل العشرية بعد الفاصلة: {n} | Spoken by a screen reader: «الفاصلة» as in the glossary's binary point. |
| `ui.numeric.decimal.places.other` | digits 0 to 9, and up to {n} decimal places after the point | أرقام من 0 إلى 9. أقصى عدد للمنازل العشرية بعد الفاصلة: {n} | |
| `ui.numeric.decimal.signed-places.one` | digits 0 to 9, a leading minus sign, and up to {n} decimal place after the point | أرقام من 0 إلى 9، وإشارة ناقص في البداية. أقصى عدد للمنازل العشرية بعد الفاصلة: {n} | |
| `ui.numeric.decimal.signed-places.other` | digits 0 to 9, a leading minus sign, and up to {n} decimal places after the point | أرقام من 0 إلى 9، وإشارة ناقص في البداية. أقصى عدد للمنازل العشرية بعد الفاصلة: {n} | |

## 5. Tutor engine: help that follows the learner's step (#690, PR #695, not merged yet)

| Key | English | Proposed Arabic | Notes |
|---|---|---|---|
| `hint.try-first-or-stuck` | Give it one try first, or tell me you are stuck. | جرّب مرة واحدة أولاً، أو أخبرني أنك عالق. | Extends the approved «جرّب مرة واحدة أولاً». |
| `idle.quiet` | Take your time. If you are stuck, say so. | خذ وقتك. وإذا كنت عالقًا فقل لي. | |
| `stuck.start` | That is fine. Let us look at this step together. | لا بأس. لنلقِ نظرة على هذه الخطوة معًا. | |
| `stuck.offer` | Want another hint, or shall I explain it slowly? | هل تريد تلميحًا آخر، أم أشرح لك الأمر ببطء؟ | "Explain Slowly" is the name of the feature in English UI; here it is a verb phrase. |
| `explain.confirm-restart` | This walks through a worked example. Afterwards you start this question again with new numbers. Go ahead? | هذا شرح بمثال محلول. بعده تبدأ هذا السؤال من جديد بأرقام جديدة. هل نتابع؟ | |

## 6. Practice titles

Owner decision 5: canonical topic and practice titles stay English for now; the Arabic UI may surround them with LTR isolation. Nothing to translate here, and the `{title}` buttons in section 2 are unblocked.

## Still to come (added as the PRs land)

- Learning step 1b (UI): "I'm stuck", "Show a hint", "Explain slowly", "Back to my step", the restart confirmation buttons.
- Navigation S2–S4 (practice navigator, declared entries, resume rules): their PR bodies will list strings; this file gets a section each.
- The practice navigator's status words and "Steps before this one".

## Decisions applied (owner, #697)

1. المقررات; no «الـ + English plural». 2. «الخطوة التالية المقترحة»; تمرين / تمارين. 3. «المكوّن» for a generic component; «Device (جهاز)» for the course concept. 4. Label:value plurals. 5. Titles stay English. 6. RTL rendering is checked by QA on the draft strings PR.

Open note for the owner: «الـ Topic» (section 2) keeps the earlier decision that Topic stays English; say if it should follow the same rule as المقررات.
