# Arabic batch for the new navigation labels (#676, epic #670)

**Status: DRAFT for the owner's approval. Nothing here ships until the owner approves it.** Content Engineer, 2026-10-13, main @ f53dec5.

How to read it: `key · English · proposed Arabic · notes`. A row marked **decide** needs the owner. Every `{slot}` is kept exactly. Digits are Western. The rules are the owner's (REQUIREMENTS.md): Modern Standard Arabic, slightly conversational; English technical terms stay English and are LTR-isolated; no machine translation. Terms follow `TECHNICAL_GLOSSARY_AR.md`; "Course", "Chapter" and "Topic" stay English (owner, 2026-10-13, #676), written with the `الـ` prefix as the approved package does («الـ Processors»). Address is the masculine imperative, as the approved package does (جرّب، ابحث).

How it ships after approval: one PR appends these entries (id = `ui.<key>`, type `ui-label`, no course, so they go to the shared map) to `source-texts.json` and `source-texts.ar.json`; `scripts/build-l10n.mjs` builds the maps; `localization.ar.test.ts` keeps the pair in step. Until then the app shows the English.

What is already covered: all 229 non-`ui.*` catalog keys have Arabic in the approved package, and four `ui.stage.*` keys and `ui.summary.hints.zero` match approved strings. What is missing is listed below: 30 labels from the navigation PRs (sections 1–3), 13 older component strings (section 4), 5 from the tutor engine (section 5), 4 changed titles (section 6).

## 1. Where am I, and the way up (#674, PR #689)

| Key | English | Proposed Arabic | Notes |
|---|---|---|---|
| `ui.nav.here` | You are here | أنت هنا | Accessible name of the location line. Auditor proposal on #676. |
| `ui.nav.show-path` | Show the whole path | اعرض المسار كاملًا | The "…" button on phones. |
| `ui.nav.all-courses` | All courses | كل الـ Courses | Per the owner's decision. **decide**: the form «الـ + English plural». |
| `ui.nav.courses-moved` | The courses are listed on the home page. | الـ Courses معروضة في الصفحة الرئيسية. | Same form. |
| `ui.nav.go-courses` | Go to the courses | اذهب إلى الـ Courses | Same form. |

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
| `ui.action.recommended` | Recommended next | المقترح تاليًا | The caption over the filled button. **decide** if you prefer «الخطوة التالية المقترحة» (longer). |
| `ui.topic.practices` | Practices: {titles} | التمارين: {titles} | **decide** the word for "practice": تمارين, or keep "Practices" in English like Topic. |
| `ui.row.more` | +{n} more | +{n} أخرى | «أخرى» agrees with any plural of a non-human noun; no number agreement needed. |

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
| `ui.kind.device` | Read the device | اقرأ المكوّن | Here "device" is a decoder or multiplexer; «جهاز» is the glossary's OS device, so «المكوّن» avoids the clash. **decide** |
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

These are on main already and have no Arabic, because the pre-catalog versions held `${…}` expressions that could not be translated (TRANSLATION_REVIEW_NOTES.md). The catalog has `one` and `other` forms only: Arabic also has a dual (2) and different forms for 3–10 and 11+, so «{n} تحديات» is right for 3–10 and acceptable for 2 and 11+. **decide** whether to add `two`/`many` forms to the plural catalog (a UI change) or accept that.

| Key | English | Proposed Arabic | Notes |
|---|---|---|---|
| `ui.summary.line` | {activity}: {challenges}, {attempts}, {hints}. | {activity}: {challenges}، {attempts}، {hints}. | Arabic comma. |
| `ui.summary.challenges.one` | {n} challenge | {n} تحدٍّ | |
| `ui.summary.challenges.other` | {n} challenges | {n} تحديات | The package already says التحدي. |
| `ui.summary.attempts.one` | {n} attempt | {n} محاولة | |
| `ui.summary.attempts.other` | {n} attempts | {n} محاولات | |
| `ui.summary.hints.one` | hints used on {n} challenge | استخدمت تلميحات في {n} تحدٍّ | Zero form is already approved: «لم تحتج إلى تلميحات». |
| `ui.summary.hints.other` | hints used on {n} challenges | استخدمت تلميحات في {n} تحديات | |
| `ui.numeric.decimal` | digits 0 to 9 | أرقام من 0 إلى 9 | |
| `ui.numeric.decimal.signed` | digits 0 to 9, a leading minus sign | أرقام من 0 إلى 9، وإشارة ناقص في البداية | |
| `ui.numeric.decimal.places.one` | digits 0 to 9, and up to {n} decimal place after the point | أرقام من 0 إلى 9، وحتى {n} منزلة عشرية بعد الفاصلة | Spoken by a screen reader: «الفاصلة» as in the glossary's binary point. |
| `ui.numeric.decimal.places.other` | digits 0 to 9, and up to {n} decimal places after the point | أرقام من 0 إلى 9، وحتى {n} منازل عشرية بعد الفاصلة | |
| `ui.numeric.decimal.signed-places.one` | digits 0 to 9, a leading minus sign, and up to {n} decimal place after the point | أرقام من 0 إلى 9، وإشارة ناقص في البداية، وحتى {n} منزلة عشرية بعد الفاصلة | |
| `ui.numeric.decimal.signed-places.other` | digits 0 to 9, a leading minus sign, and up to {n} decimal places after the point | أرقام من 0 إلى 9، وإشارة ناقص في البداية، وحتى {n} منازل عشرية بعد الفاصلة | |

## 5. Tutor engine: help that follows the learner's step (#690, PR #695, not merged yet)

| Key | English | Proposed Arabic | Notes |
|---|---|---|---|
| `hint.try-first-or-stuck` | Give it one try first, or tell me you are stuck. | جرّب مرة واحدة أولاً، أو أخبرني أنك عالق. | Extends the approved «جرّب مرة واحدة أولاً». |
| `idle.quiet` | Take your time. If you are stuck, say so. | خذ وقتك. وإذا كنت عالقًا فقل لي. | |
| `stuck.start` | That is fine. Let us look at this step together. | لا بأس. لنلقِ نظرة على هذه الخطوة معًا. | |
| `stuck.offer` | Want another hint, or shall I explain it slowly? | هل تريد تلميحًا آخر، أم أشرح لك الأمر ببطء؟ | "Explain Slowly" is the name of the feature in English UI; here it is a verb phrase. |
| `explain.confirm-restart` | This walks through a worked example. Afterwards you start this question again with new numbers. Go ahead? | هذا شرح بمثال محلول. بعده تبدأ هذا السؤال من جديد بأرقام جديدة. هل نتابع؟ | |

## 6. Practice titles whose English changed (#693, PR #696)

Titles are navigation text; the scope decision (AUDIT.md §3) is open, so **do not ship these until the owner decides it**. Drafted so the decision is easy.

| Where | English | Proposed Arabic | Notes |
|---|---|---|---|
| title, `subtraction-exercise-positive` | Exercise: 4-bit subtraction, a positive result | تمرين: طرح 4-bit، نتيجة موجبة | |
| title, `subtraction-exercise-negative` | Exercise: 4-bit subtraction, a negative result | تمرين: طرح 4-bit، نتيجة سالبة | |
| title, `conversion-exercise` | Exercise: convert to binary, octal and hexadecimal | تمرين: التحويل إلى Binary (ثنائي) وOctal (ثماني) وHexadecimal (سداسي عشري) | Glossary form `English (Arabic)`. |
| summary, `binary-addition` | The four rules, then a sum column by column, then a check in decimal. | القواعد الأربع، ثم مجموع عمودًا عمودًا، ثم تحقق بالنظام العشري. | |

## Still to come (added as the PRs land)

- Learning step 1b (UI): "I'm stuck", "Show a hint", "Explain slowly", "Back to my step", the restart confirmation buttons.
- Navigation S2–S4 (practice navigator, declared entries, resume rules): their PR bodies will list strings; this file gets a section each.
- The practice navigator's status words and "Steps before this one".

## Decisions needed (summary)

1. The form «الـ + English plural» for "Courses" (section 1).
2. "Recommended next" wording; the word for "practice" (section 2).
3. «المكوّن» for "device" in the kind label (section 3).
4. Whether the plural catalog gets dual/many forms (section 4).
5. Navigation text scope: do titles and summaries get Arabic? (blocks section 6, and the `{title}` in section 2.)
