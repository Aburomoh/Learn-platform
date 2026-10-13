# Arabic batch for the new navigation labels (#676, epic #670)

**Status: REVISED per the owner's decisions of 2026-10-13 (#697), for final approval. Nothing here ships until the owner approves it.** The real strings are in the draft PR #702's package files so QA can render them. Content Engineer, 2026-10-13, main @ f53dec5.

How to read it: `key · English · proposed Arabic · notes`. A row marked **decide** needs the owner. Every `{slot}` is kept exactly. Digits are Western. The rules are the owner's (REQUIREMENTS.md): Modern Standard Arabic, slightly conversational; English technical terms stay English and are LTR-isolated; no machine translation. Terms follow `TECHNICAL_GLOSSARY_AR.md`; "Courses" is «المقررات», with no hybrid «الـ Courses» form (owner decision 1, #697). "Topic" is «الموضوع» in navigation (owner, #697); "Chapter" stays English («Chapter 1») and «جمّع الـ Bits» keeps the course term. Address is the masculine imperative, as the approved package does (جرّب، ابحث).

How it ships after approval: one PR appends these entries (id = `ui.<key>`, type `ui-label`, no course, so they go to the shared map) to `source-texts.json` and `source-texts.ar.json`; `scripts/build-l10n.mjs` builds the maps; `localization.ar.test.ts` keeps the pair in step. Until then the app shows the English.

What is already covered: all 229 non-`ui.*` catalog keys have Arabic in the approved package, and four `ui.stage.*` keys and `ui.summary.hints.zero` match approved strings. What is missing is listed below: 30 labels from the navigation PRs (sections 1–3), 13 older component strings (section 4), 5 from the tutor engine (section 5), 4 changed titles (section 6).

## 1. Where am I, and the way up (#674, PR #689)

| Key | English | Proposed Arabic | Notes |
|---|---|---|---|
| `ui.nav.here` | You are here | أنت هنا | Accessible name of the location line. Auditor proposal on #676. |
| `ui.nav.show-path` | Show the whole path | اعرض المسار كاملًا | The "…" button on phones. |
| `ui.nav.all-courses` | All courses | المقررات | Owner decision 1; Auditor 3a: shorter, so the clipped header link keeps its meaning. Destination is the courses list. |
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
| `ui.action.next-topic` | Next topic · {title} | الموضوع التالي · {title} | Owner decision, #697: Topic is «الموضوع» in navigation. |
| `ui.action.open-topic` | Open topic | افتح الموضوع | Owner decision, #697. |
| `ui.action.recommended` | Recommended next | الخطوة التالية المقترحة | Owner decision 2. |
| `ui.topic.practices` | Practices: {titles} | التمارين: {titles} | Owner decision 2: تمرين / تمارين. Titles stay English. |
| `ui.row.more` | +{n} more | +{n} | Auditor 3b: «أخرى: n» reads «1 :أخرى» at the end of an English list; «+n» needs no plural. UI: nowrap. |

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
| `ui.kind.numeric` | Type the number | اكتب العدد | عدد (number), not رقم (digit), per the Auditor. |
| `ui.kind.place-value` | Place value | القيمة المكانية | Glossary. |
| `ui.kind.repeated-division` | Step-by-step division | قسمة خطوة بخطوة | |
| `ui.kind.state-diagram` | State diagram | مخطط الحالات | State (حالة), glossary. |
| `ui.kind.timing` | Timing diagram | مخطط التوقيت | |
| `ui.kind.truth-table` | Fill the table | املأ الجدول | Truth table (جدول الحقيقة) names the object; the action is "fill the table". |

## 4. Older component strings found missing while collecting (not from the nav PRs)

These are on main already and have no Arabic, because the pre-catalog versions held `${…}` expressions that could not be translated (TRANSLATION_REVIEW_NOTES.md). Owner decision 4: label:value forms, the same string for `one` and `other`, so no Arabic number agreement is needed.

| Key | English | Proposed Arabic | Notes |
|---|---|---|---|
| `ui.summary.line` | {activity}: {challenges}, {attempts}, {hints}. | {activity} · {challenges} · {attempts} · {hints} | Middle dot, as the location line uses; no colon after the title (Auditor 3c). |
| `ui.summary.challenges.one` | {n} challenge | التحديات: {n} | |
| `ui.summary.challenges.other` | {n} challenges | التحديات: {n} | The package already says التحدي. |
| `ui.summary.attempts.one` | {n} attempt | المحاولات: {n} | |
| `ui.summary.attempts.other` | {n} attempts | المحاولات: {n} | |
| `ui.summary.hints.one` | hints used on {n} challenge | بمساعدة التلميحات: {n} | Zero form is already approved: «لم تحتج إلى تلميحات». |
| `ui.summary.hints.other` | hints used on {n} challenges | بمساعدة التلميحات: {n} | |
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

## 7. Corrections to live strings (#701, Auditor proposals on #686)

In these seven approved strings two English terms meet across a full stop and read as one English phrase; the first one reverses the correction it exists to give. An Arabic word now separates them. Terminology is unchanged. Applied in the draft strings PR #702 so QA can render them.

| Id | Current Arabic | Proposed Arabic |
|---|---|---|
| `tutor.c1.gave-twos` | هذا هو 2's Complement. 1's Complement يعكس الـ Bits فقط؛ لا يضيف شيئاً. | هذا هو 2's Complement. أمّا 1's Complement فيعكس الـ Bits فقط، ولا يضيف شيئًا. |
| `tutor.expr.and-or-swapped`, `tutor.tt.and-or-swapped` | …AND وOR. AND يحتاج كل الأجزاء = 1؛ أما OR فيكفيه جزء واحد. | …AND وOR. فـ AND يحتاج كل الأجزاء = 1، أمّا OR فيكفيه جزء واحد. |
| `tutor.ff.t-as-d` | T لا تُنسخ إلى Q. T = 1 يعني Complement: ما قيمة Q′ هنا؟ | T لا تُنسخ إلى Q. فـ T = 1 يعني Complement: ما قيمة Q′ هنا؟ |
| `tutor.vm.quotient-remainder-swap` | …الـ Address. Page Number هو Quotient وDisplacement هو Remainder. | …الـ Address. فالـ Page Number هو Quotient، والـ Displacement هو Remainder. |
| cpet181 `vm.q.virtual.v1.hints[2]` | …Main Memory. Job Size غير محدود بحجم Main Memory. | …Main Memory، إذ إنّ Job Size غير محدود بحجم Main Memory. |
| ecet111 `lg.q.predict.v101.hints[3]` | هذا هو الـ Gate. Inputs الخاصة به هي {gateInputs}. | هذا هو الـ Gate، ومداخله (Inputs) هي {gateInputs}. Owner chose this form (#697). |

The same pattern exists in 73 more approved strings (`npm run l10n:drift`, UNTRANSLATED.md section "English terms that meet across a full stop"). Many are the "TERM. Gloss is TERM" hint shape. Say whether the Auditor should propose fixes for all of them.

## 8. Addendum (proposal): the English chrome around the translated labels

QA's real render of #702 on #710 (69e7c6d) shows English text on the same screens as the labels above. These strings are **not** in this batch and **not** in #702: the owner decides whether they join it (Lead, #702). Same rules as sections 1–7: owner decisions 1–5 (#697), label:value plurals with one string for `one` and `other`, English titles stay English, Western digits. All of them are hard-coded in components today (no catalog key, so no entry in the package), which is a UI change (move each into `en.ts` as a `ui.*` key, with `{n}` slots); the Arabic below is what the key would carry. Minutes are written «د» after a figure, so there is no dual or plural of «دقيقة».

| Where (source) | English | Proposed Arabic | Notes |
|---|---|---|---|
| Course row, topic status (`CourseTopics.tsx`) | {done} of {total} challenges done | التحديات المنجزة: {done} من {total} | Label:value. |
| same | · skipped ahead | · تخطّيت بعضها | Appended to the line above; "skipped" is the learner's own act. |
| same | In progress · {done} of {total} topics done | قيد المتابعة · المواضيع المنجزة: {done} من {total} | |
| same | {n} short practices · about {m} min | التمارين القصيرة: {n} · المدة: نحو {m} د | |
| same, topic page row | Completed | مكتمل | |
| Topic page, effort (`TopicNext.tsx`) | Completed. You can review it any time. | اكتمل. يمكنك مراجعته في أي وقت. | |
| same | About {n} min | المدة: نحو {n} د | |
| same, step label | {title} · {n} short challenges | {title} · التحديات القصيرة: {n} | Title stays English, LTR-isolated. |
| same, row status | about {n} min | المدة: نحو {n} د | |
| same | {n} of {total} challenges done | التحديات المنجزة: {n} من {total} | As in the course row. |
| same, heading | Practices in this topic | التمارين في هذا الموضوع | Decision 2: تمرين / تمارين; Topic is «الموضوع». |
| same, list name for screen readers | Challenges of {title} / Challenges | تحديات {title} / التحديات | |
| Under the button (`PrimaryAction.tsx`) | {n} short challenges · about {m} min | التحديات القصيرة: {n} · المدة: نحو {m} د | |
| Home (`HomeNext.tsx`) | Challenge {k} of {n} · about {m} min left | التحدي {k} من {n} · المتبقي: نحو {m} د | |
| same, returning | Welcome back | أهلًا بعودتك | |
| same | Pick up where you left off | أكمل من حيث توقفت | |
| same | You have finished every topic | أنهيت كل المواضيع | |
| same, first visit | Start here | ابدأ من هنا | |
| same | Your course / Your courses | مقررك / مقرراتك | Decision 1: مقرر, no hybrid form. |
| End of a practice (`ActivitySummary.tsx`) | Practice complete | اكتمل التمرين | Also the section's accessible name. |
| same | You can now: | أصبحت قادرًا الآن على: | The learner's objectives follow, in English (objectives are course text). |
| same | Practise again | تدرّب مرة أخرى | The approved package uses التدرّب. |
| same | Back to topic | العودة إلى الموضوع | |

### 8b. The rest of the chrome on the practice screen and the global chrome

Owner chose (a) on #702: these join the batch. Same rules. "Check", "Hint" and the other buttons are the app's own words, not course text. Bit stays English (glossary). The kind-specific labels inside the interactions (column headings, "Result", "Remainder", figure captions) are drawn by the figures and are a separate list if the owner wants it.

| Where (source) | English | Proposed Arabic | Notes |
|---|---|---|---|
| Footer (`Chrome.tsx`) | Demo content | محتوى تجريبي | |
| same | Optional practice, not graded | تدريب اختياري، بلا درجات | |
| same | Progress stays in this browser | يبقى تقدّمك في هذا المتصفح | |
| Profile menu (`ProfileMenu.tsx`) | Profile and settings | الملف الشخصي والإعدادات | Accessible name. |
| same | Guest | ضيف | |
| same | You are a guest. | أنت ضيف. | |
| same | Your progress stays in this browser. Nothing is sent to a server. | يبقى تقدّمك في هذا المتصفح. لا يُرسل أي شيء إلى خادم. | |
| same | Appearance | المظهر | |
| same | Light / Dark / Match device | فاتح / داكن / حسب الجهاز | «الجهاز» here is the user's own device, not the OS device of the course. |
| same | Settings | الإعدادات | |
| Language toggle | Language | اللغة | Accessible name; the choices «EN» and «عربي» stay as they are. |
| Course page | Chapters | Chapters | **decide**: «Chapter» stays English (owner, #697), so the plural heading stays «Chapters» (or «الـ Chapters»). |
| Topic page (`MeetCard.tsx`) | How it works | كيف يعمل | |
| Home (`HomeNext.tsx`) | Open course: {title} | افتح المقرر: {title} | Accessible name. |
| Practice header (`ActivityRunner.tsx`) | Challenge {k} of {n} | التحدي {k} من {n} | The step label that may follow stays English (course text). |
| same | Next steps | الخطوات التالية | Accessible name of the buttons after a correct answer. |
| same | Try a similar one | جرّب سؤالًا مشابهًا | |
| same | Next challenge / Finish | التحدي التالي / إنهاء | |
| Hint panel (`HintReveal.tsx`) | Hint / Another hint | تلميح / تلميح آخر | |
| same | Explain slowly | اشرح ببطء | |
| same | Hints | التلميحات | Accessible name. |
| Hint cards | Nudge · Concept · Question · Look here · Break it down · Similar example · Guided · Full explanation | تلميح أولي · المفهوم · سؤال موجّه · انظر هنا · قسّمها · مثال مشابه · بإرشاد · الشرح الكامل | The ladder's names, one per rung. |
| Check buttons (interactions) | Check / Check step / Check bits / Check groups / Check digit | تحقّق / تحقّق من الخطوة / تحقّق من الـ Bits / تحقّق من المجموعات / تحقّق من الرقم | Bit stays English (glossary). |
| Explanation (`QuestionView.tsx`) | Explanation | الشرح | Accessible name. |
| same | Question | السؤال | Accessible name. |
| same | Step {k} of {n} | الخطوة {k} من {n} | |
| same | Continue / Now I try | تابع / الآن أجرّب أنا | |
| Skip menu (`SkipMenu.tsx`) | More | المزيد | Accessible name. |
| same | Skip to next question | تخطَّ إلى السؤال التالي | |
| same | Skip this question? You can come back any time. This goes to {targetLabel}. | تخطّي هذا السؤال؟ يمكنك العودة إليه في أي وقت. الوجهة: {targetLabel}. | Label:value, so the destination phrase needs no case. |
| same | Confirm skip | تأكيد التخطي | Accessible name. |
| same | Skip / Cancel | تخطَّ / إلغاء | |
| Skip destinations | the next question · the next practice, {title} · the next topic, {title} · the course page | السؤال التالي · التمرين التالي: {title} · الموضوع التالي: {title} · صفحة المقرر | Written without the article so they fit after «الوجهة:». |
| Return offers (`ActivityRunner.tsx`) | Stuck? You skipped {label}; it leads here. Go back any time. | عالق؟ لقد تخطّيت {label}؛ فهو يقود إلى هنا. يمكنك الرجوع في أي وقت. | {label} is a challenge label (English, isolated). |
| same | Stuck? You skipped ahead in {title}; it covers this. Go back any time. | عالق؟ لقد تخطّيت جزءًا في {title}؛ فهو يغطي هذا. يمكنك الرجوع في أي وقت. | {title} stays English, isolated. |

Not drafted here (course text or other scope): the objective lists of "You can now", question prompts, the labels drawn inside the figures and interactions, and the settings page (`SettingsForm.tsx`, long explanatory text). Say if the owner wants any of them as a further addendum.

## Still to come (added as the PRs land)

- Learning step 1b (UI): "I'm stuck", "Show a hint", "Explain slowly", "Back to my step", the restart confirmation buttons.
- Navigation S2–S4 (practice navigator, declared entries, resume rules): their PR bodies will list strings; this file gets a section each.
- The practice navigator's status words and "Steps before this one".

## Decisions applied (owner, #697)

1. المقررات; no «الـ + English plural». 2. «الخطوة التالية المقترحة»; تمرين / تمارين. 3. «المكوّن» for a generic component; «Device (جهاز)» for the course concept. 4. Label:value plurals. 5. Titles stay English. 6. RTL rendering is checked by QA on the draft strings PR.

7. Owner, 2026-10-13 (#697): Topic is Arabic in navigation («الموضوع التالي · {title}», «افتح الموضوع»); "Chapter" in the location line stays English; «جمّع الـ Bits» stays; `lg.q.predict.v101.hints[3]` takes «هذا هو الـ Gate، ومداخله (Inputs) هي {gateInputs}.»
