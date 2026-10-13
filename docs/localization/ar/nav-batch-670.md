# Arabic batch for the new navigation labels (#676, epic #670)

**Status: APPROVED by the owner, 2026-10-13 (#697): A = this document, #702 (merged), the #701 corrections and the four ending fixes; B = #722, the 80 endings on English terms and the divide Concept hint (#686 batches 4 and 5). Not covered: section 8f (the four #719 navigator strings), a separate approval.** Content Engineer, main @ f53dec5.

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

QA's real render of #702 on #710 (69e7c6d) shows English text on the same screens as the labels above. The owner chose (a) on #702: these strings join the batch and are in the draft package (section 8c). Same rules as sections 1–7: owner decisions 1–5 (#697), label:value plurals with one string for `one` and `other`, English titles stay English, Western digits. All of them were hard-coded in components, so each now has a `ui.*` catalog key (section 8c) and the UI still has to read it through the Arabic layer. Minutes are written «د» after a figure, so there is no dual or plural of «دقيقة».

| Where (source) | English | Proposed Arabic | Notes |
|---|---|---|---|
| Course row, topic status (`CourseTopics.tsx`) | {done} of {total} challenges done | التحديات المنجزة: {done} من {total} | Label:value. |
| same | · skipped ahead | · تخطّيت بعضها | Appended to the line above; "skipped" is the learner's own act. |
| same | In progress · {done} of {total} topics done | جارٍ · المواضيع المنجزة: {done} من {total} | Auditor §8: «جارٍ», not «قيد المتابعة». |
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
| same | You can now: | يمكنك الآن: | **Already approved** in the package (component text); kept. The Auditor first proposed «تستطيع الآن:» and withdrew it: no decision needed. |
| same | Practise again | تدرّب مرة أخرى | The approved package uses التدرّب. |
| same | Back to topic | العودة إلى الموضوع | |

### 8b. The rest of the chrome on the practice screen and the global chrome

Owner chose (a) on #702: these join the batch. Same rules. "Check", "Hint" and the other buttons are the app's own words, not course text. Bit stays English (glossary). The kind-specific labels inside the interactions (column headings, "Result", "Remainder", figure captions) are drawn by the figures and are a separate list if the owner wants it.

| Where (source) | English | Proposed Arabic | Notes |
|---|---|---|---|
| Footer (`Chrome.tsx`) | Demo content | محتوى تجريبي | |
| same | Optional practice, not graded | تدريب اختياري، بلا درجات | |
| same | Progress stays in this browser | يُحفظ تقدّمك في هذا المتصفح فقط | Owner chose the Auditor's form (#697): it says plainly that nothing leaves the browser. |
| Profile menu (`ProfileMenu.tsx`) | Profile and settings | الملف الشخصي والإعدادات | Accessible name. |
| same | Guest | ضيف | |
| same | You are a guest. | أنت ضيف. | |
| same | Your progress stays in this browser. Nothing is sent to a server. | يبقى تقدّمك في هذا المتصفح. لا يُرسل أي شيء إلى خادم. | |
| same | Appearance | المظهر | |
| same | Light / Dark / Match device | فاتح / داكن / حسب الجهاز | «الجهاز» here is the user's own device, not the OS device of the course. |
| same | Settings | الإعدادات | |
| Language toggle | Language | اللغة | Accessible name; the choices «EN» and «عربي» stay as they are. |
| Course page | Chapters | Chapters | «Chapter» stays English (owner, #697), so the plural heading stays «Chapters» (Auditor: no «الـ»). |
| Topic page (`MeetCard.tsx`) | How it works | كيف يعمل | |
| Home (`HomeNext.tsx`) | Open course: {title} | افتح المقرر: {title} | Accessible name. |
| Practice header (`ActivityRunner.tsx`) | Challenge {k} of {n} | التحدي {k} من {n} | The step label that may follow stays English (course text). |
| same | Next steps | الخطوات التالية | Accessible name of the buttons after a correct answer. |
| same | Try a similar one | جرّب سؤالًا مشابهًا | |
| same | Next challenge / Finish | التحدي التالي / إنهاء | |
| Hint panel (`HintReveal.tsx`) | Hint / Another hint | تلميح / تلميح آخر | |
| same | Explain slowly | اشرح ببطء | |
| same | Hints | التلميحات | Accessible name. |
| Hint cards | Nudge · Concept · Question · Look here · Break it down · Similar example · Guided · Full explanation | تلميح أولي · المفهوم · السؤال · انظر هنا · قسّمها إلى خطوات أبسط · مثال مشابه · حلّ موجّه · الشرح الكامل | The ladder's names, one per rung. «Break it down», «Similar example» and «Full explanation» are **already approved** (kept); the Auditor's alternative «تقسيم المسألة» was withdrawn. «Question» is one English word for the card and the section name, so one Arabic («السؤال»). «Guided» → «حلّ موجّه» (Auditor). |
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
| Return offers (`ActivityRunner.tsx`) | Stuck? You skipped {label}; it leads here. Go back any time. | هل تواجه صعوبة؟ لقد تخطّيت {label}؛ وهو يمهّد لهذا السؤال. يمكنك الرجوع في أي وقت. | {label} is a challenge label (English, isolated). |
| same | Stuck? You skipped ahead in {title}; it covers this. Go back any time. | هل تواجه صعوبة؟ لقد تخطّيت جزءًا في {title}؛ وفيه شرح لهذا. يمكنك الرجوع في أي وقت. | {title} stays English, isolated. |

### 8c. Where these strings are in the draft package

They are in draft PR #702 (maps rebuilt) with a catalog key each in `src/tutor/messages/en.ts`. The two already-approved strings above keep their approved Arabic; the Auditor withdrew both alternatives. Almost all are hard-coded in components today, so a عربي screen shows them only when UI reads these keys through the Arabic layer (as #710 does for the navigation labels). The label:value count families have one string for `one` and `other`.

| Key | English | Arabic |
|---|---|---|
| `ui.topic.done` | {done} of {total} challenges done | التحديات المنجزة: {done} من {total} |
| `ui.topic.skipped` | skipped ahead | تخطّيت بعضها |
| `ui.topic.in-progress.one` | In progress · {done} of {n} topic done | جارٍ · المواضيع المنجزة: {done} من {n} |
| `ui.topic.in-progress.other` | In progress · {done} of {n} topics done | جارٍ · المواضيع المنجزة: {done} من {n} |
| `ui.topic.short-practices` | {n} short practices · about {m} min | التمارين القصيرة: {n} · المدة: نحو {m} د |
| `ui.status.completed` | Completed | مكتمل |
| `ui.topic.completed-note` | Completed. You can review it any time. | اكتمل. يمكنك مراجعته في أي وقت. |
| `ui.topic.about-min` | About {m} min | المدة: نحو {m} د |
| `ui.topic.about-min.lower` | about {m} min | المدة: نحو {m} د |
| `ui.topic.practice-challenges.one` | {title} · {n} short challenge | {title} · التحديات القصيرة: {n} |
| `ui.topic.practice-challenges.other` | {title} · {n} short challenges | {title} · التحديات القصيرة: {n} |
| `ui.topic.short-challenges.one` | {n} short challenge | التحديات القصيرة: {n} |
| `ui.topic.short-challenges.other` | {n} short challenges | التحديات القصيرة: {n} |
| `ui.topic.effort.one` | {n} short challenge · about {m} min | التحديات القصيرة: {n} · المدة: نحو {m} د |
| `ui.topic.effort.other` | {n} short challenges · about {m} min | التحديات القصيرة: {n} · المدة: نحو {m} د |
| `ui.topic.practices-heading` | Practices in this topic | التمارين في هذا الموضوع |
| `ui.topic.challenges-of` | Challenges of {title} | تحديات {title} |
| `ui.topic.challenges` | Challenges | التحديات |
| `ui.home.challenge-left` | Challenge {k} of {n} · about {m} min left | التحدي {k} من {n} · المتبقي: نحو {m} د |
| `ui.home.welcome-back` | Welcome back | أهلًا بعودتك |
| `ui.home.pick-up` | Pick up where you left off | أكمل من حيث توقفت |
| `ui.home.finished-all` | You have finished every topic | أنهيت كل المواضيع |
| `ui.home.start-here` | Start here | ابدأ من هنا |
| `ui.home.your-course` | Your course | مقررك |
| `ui.home.your-courses` | Your courses | مقرراتك |
| `ui.home.open-course` | Open course: {title} | افتح المقرر: {title} |
| `ui.summary.complete` | Practice complete | اكتمل التمرين |
| `ui.summary.can-now` | You can now: | يمكنك الآن: |
| `ui.summary.again` | Practise again | تدرّب مرة أخرى |
| `ui.summary.back` | Back to topic | العودة إلى الموضوع |
| `ui.foot.demo` | Demo content | محتوى تجريبي |
| `ui.foot.optional` | Optional practice, not graded | تدريب اختياري، بلا درجات |
| `ui.foot.local` | Progress stays in this browser | يُحفظ تقدّمك في هذا المتصفح فقط |
| `ui.profile.menu` | Profile and settings | الملف الشخصي والإعدادات |
| `ui.profile.guest` | Guest | ضيف |
| `ui.profile.you-are-guest` | You are a guest. | أنت ضيف. |
| `ui.profile.local` | Your progress stays in this browser. Nothing is sent to a server. | يبقى تقدّمك في هذا المتصفح. لا يُرسل أي شيء إلى خادم. |
| `ui.profile.appearance` | Appearance | المظهر |
| `ui.profile.light` | Light | فاتح |
| `ui.profile.dark` | Dark | داكن |
| `ui.profile.system` | Match device | حسب الجهاز |
| `ui.profile.settings` | Settings | الإعدادات |
| `ui.nav.language` | Language | اللغة |
| `ui.nav.chapters` | Chapters | Chapters |
| `ui.topic.how-it-works` | How it works | كيف يعمل |
| `ui.stage.challenge-of` | Challenge {k} of {n} | التحدي {k} من {n} |
| `ui.stage.next-steps` | Next steps | الخطوات التالية |
| `ui.stage.try-similar` | Try a similar one | جرّب سؤالًا مشابهًا |
| `ui.stage.next-challenge` | Next challenge | التحدي التالي |
| `ui.stage.finish` | Finish | إنهاء |
| `ui.hint.button` | Hint | تلميح |
| `ui.hint.another` | Another hint | تلميح آخر |
| `ui.hint.explain` | Explain slowly | اشرح ببطء |
| `ui.hint.list` | Hints | التلميحات |
| `ui.hint.rung-2` | Nudge | تلميح أولي |
| `ui.hint.rung-3` | Concept | المفهوم |
| `ui.hint.rung-4` | Question | السؤال |
| `ui.hint.rung-5` | Look here | انظر هنا |
| `ui.hint.rung-6` | Break it down | قسّمها إلى خطوات أبسط |
| `ui.hint.rung-7` | Similar example | مثال مشابه |
| `ui.hint.rung-8` | Guided | حلّ موجّه |
| `ui.hint.rung-9` | Full explanation | الشرح الكامل |
| `ui.check.button` | Check | تحقّق |
| `ui.check.step` | Check step | تحقّق من الخطوة |
| `ui.check.bits` | Check bits | تحقّق من الـ Bits |
| `ui.check.groups` | Check groups | تحقّق من المجموعات |
| `ui.check.digit` | Check digit | تحقّق من الرقم |
| `ui.explain.section` | Explanation | الشرح |
| `ui.question.section` | Question | السؤال |
| `ui.explain.step` | Step {k} of {n} | الخطوة {k} من {n} |
| `ui.explain.continue` | Continue | تابع |
| `ui.explain.now-i-try` | Now I try | الآن أجرّب أنا |
| `ui.skip.more` | More | المزيد |
| `ui.skip.to-next` | Skip to next question | تخطَّ إلى السؤال التالي |
| `ui.skip.confirm-note` | Skip this question? You can come back any time. This goes to {targetLabel}. | تخطّي هذا السؤال؟ يمكنك العودة إليه في أي وقت. الوجهة: {targetLabel}. |
| `ui.skip.confirm` | Confirm skip | تأكيد التخطي |
| `ui.skip.go` | Skip | تخطَّ |
| `ui.skip.cancel` | Cancel | إلغاء |
| `ui.skip.target.question` | the next question | السؤال التالي |
| `ui.skip.target.practice` | the next practice, {title} | التمرين التالي: {title} |
| `ui.skip.target.topic` | the next topic, {title} | الموضوع التالي: {title} |
| `ui.skip.target.course` | the course page | صفحة المقرر |
| `ui.return.challenge` | Stuck? You skipped {label}; it leads here. Go back any time. | هل تواجه صعوبة؟ لقد تخطّيت {label}؛ وهو يمهّد لهذا السؤال. يمكنك الرجوع في أي وقت. |
| `ui.return.practice` | Stuck? You skipped ahead in {title}; it covers this. Go back any time. | هل تواجه صعوبة؟ لقد تخطّيت جزءًا في {title}؛ وفيه شرح لهذا. يمكنك الرجوع في أي وقت. |

### 8d. The keys #710 defines (they replace the same-concept rows of 8c)

#710 (UI) put the course, topic, Home and summary chrome into the catalogue with its own key names and slot names. The package matches by the exact English, so #702 carries Arabic for **its** templates; the same-concept draft keys of 8c (`ui.topic.done`, `ui.topic.skipped`, `ui.topic.in-progress.*`, `ui.topic.short-practices`, `ui.topic.about-min*`, `ui.topic.effort.*`, `ui.topic.short-challenges.*`, `ui.topic.completed-note`, `ui.topic.practices-heading`, `ui.home.challenge-left`, `ui.status.completed`, `ui.summary.complete`/`can-now`/`again`/`back`) were removed from `en.ts` and the package. New in #710 and not in 8: «Not started», «Not started · Coming soon», «Completed. You can review any topic.», «In progress» and «Up next» (rows). «You can now:» keeps its approved Arabic. The rest of 8c (Home headings, the runner, hint panel, Check buttons, explanation, skip menu, profile and footer) are still hard-coded and are for UI to wire with the 8c key names.

| Key | English | Arabic |
|---|---|---|
| `ui.status.completed` | Completed | مكتمل |
| `ui.status.not-started` | Not started | لم تبدأه بعد |
| `ui.status.coming-soon` | Not started · Coming soon | لم تبدأه بعد · قريبًا |
| `ui.status.challenges-done` | {done} of {total} challenges done | التحديات المنجزة: {done} من {total} |
| `ui.status.challenges-done-skipped` | {done} of {total} challenges done · skipped ahead | التحديات المنجزة: {done} من {total} · تخطّيت بعضها |
| `ui.status.chapter-progress.one/.other` | In progress · {done} of {n} topic(s) done | جارٍ · المواضيع المنجزة: {done} من {n} |
| `ui.effort.practices` | {n} short practices · about {minutes} min | التمارين القصيرة: {n} · المدة: نحو {minutes} د |
| `ui.effort.challenges.one/.other` | {n} short challenge(s) · about {minutes} min | التحديات القصيرة: {n} · المدة: نحو {minutes} د |
| `ui.effort.short-challenges.one/.other` | {n} short challenge(s) | التحديات القصيرة: {n} |
| `ui.effort.minutes` | about {n} min | المدة: نحو {n} د |
| `ui.effort.minutes-lead` | About {n} min | المدة: نحو {n} د |
| `ui.effort.remaining` | Challenge {next} of {total} · about {left} min left | التحدي {next} من {total} · المتبقي: نحو {left} د |
| `ui.effort.completed-topic` | Completed. You can review it any time. | اكتمل. يمكنك مراجعته في أي وقت. |
| `ui.effort.completed-all` | Completed. You can review any topic. | اكتمل. يمكنك مراجعة أي موضوع. |
| `ui.row.in-progress` | In progress | جارٍ |
| `ui.row.up-next` | Up next | التالي |
| `ui.topic.practices-in` | Practices in this topic | التمارين في هذا الموضوع |
| `ui.summary.title` | Practice complete | اكتمل التمرين |
| `ui.summary.you-can` | You can now: | يمكنك الآن: (approved) |
| `ui.summary.again` | Practise again | تدرّب مرة أخرى |
| `ui.summary.back` | Back to topic | العودة إلى الموضوع |

New wording to check: «لم تبدأه بعد», «قريبًا», «التالي» (a row that is next), «اكتمل. يمكنك مراجعة أي موضوع.».

### 8e. Nine more keys from #714

UI added nine keys in #714 that section 8c did not have. Same rules: label:value, one string for `one` and `other`, «Chapter» stays English, English titles and the owner's name stay as they are.

| Key | English | Arabic | Notes |
|---|---|---|---|
| `ui.home.first-route` | Practice for {owner}'s courses. No account needed. | تدريب على مقررات {owner}. لا حاجة إلى حساب. | {owner} is the instructor's name, LTR-isolated. |
| `ui.home.chapters.one/.other` | {n} chapter(s) | Chapters: {n} | «Chapter» stays English. |
| `ui.home.topics.one/.other` | {n} topic(s) | المواضيع: {n} | |
| `ui.home.done` | {n} done | المنجزة: {n} | On a course row, next to the counts above. |
| `ui.home.started` | {n} started | الجارية: {n} | Counts of topics agree with المواضيع (Auditor); a single status stays «جارٍ». |
| `ui.home.open-course-short` | Open course | افتح المقرر | The visible link text. |
| `ui.stage.challenge-n` | Challenge {n} | التحدي {n} | |

### 8f. Four keys from #719 (the practice navigator and the summary exits)

QA: without these the navigator stays English in عربي. **Not covered by the owner's approval of A and B, and not in #702**: they go to the owner as a small separate approval. Label:value, no brackets (the owner's plural rule; #720 on brackets).

| Key | English | Arabic | Notes |
|---|---|---|---|
| `ui.nav.practices-count` | Practices in this topic ({k} of {n}) | التمارين في هذا الموضوع: {k} من {n} | Same words as the heading in 8d. |
| `ui.row.here` | Here | هنا | The current practice's row, no link. |
| `ui.summary.another` | Another practice in this topic | تمرين آخر في هذا الموضوع | |
| `ui.summary.course-map` | Course map | خريطة المقرر | |

Not drafted here (course text or other scope): the objective lists of "You can now", question prompts, the labels drawn inside the figures and interactions, and the settings page (`SettingsForm.tsx`, long explanatory text). Say if the owner wants any of them as a further addendum.

## 9. Arabic endings on English terms (#686 batch 3): decided

Owner, 2026-10-13 (#697): the glossary rule is **no Arabic ending attached to an English term** (added to `TECHNICAL_GLOSSARY_AR.md`). The four broken strings are fixed in this batch (applied in #702):

| Id | Fixed Arabic |
|---|---|
| `…ns.q.divide.v26.explanation[0].say` | … كل Remainder (باقٍ) يصبح Bit واحدًا. |
| `…ns.q.divide.v75.explanation[0].say` | اقسم {value} على 2 مراراً. كل Remainder يصبح Bit واحدًا. |
| `…ns.q.hex.v26.explanation[1].say` | الـ Group اليسرى فيها Bit واحد فقط. |
| `tutor.lg.nand-not` | NAND يأخذ اثنين من الـ Inputs. أي Gate يأخذ Input واحدًا فقط ويعكسه؟ |

The remaining approved strings with an ending attached (76 after these four, listed by `npm run l10n:drift`) come in the **next** batch: the Auditor proposes, Content applies, and they do not block this release.

## Still to come (added as the PRs land)

- Learning step 1b (UI): "I'm stuck", "Show a hint", "Explain slowly", "Back to my step", the restart confirmation buttons.
- Navigation S2–S4 (practice navigator, declared entries, resume rules): their PR bodies will list strings; this file gets a section each.
- The practice navigator's status words and "Steps before this one".

## Decisions applied (owner, #697)

8. Owner, 2026-10-13: the instructor's name stays in English in Arabic mode (`ui.home.first-route`, the tutor's name label). The changed division hint is moot (#718 kept the approved string). The four endings fixes of §9 are in this batch; the glossary rule is adopted.

1. المقررات; no «الـ + English plural». 2. «الخطوة التالية المقترحة»; تمرين / تمارين. 3. «المكوّن» for a generic component; «Device (جهاز)» for the course concept. 4. Label:value plurals. 5. Titles stay English. 6. RTL rendering is checked by QA on the draft strings PR.

7. Owner, 2026-10-13 (#697): Topic is Arabic in navigation («الموضوع التالي · {title}», «افتح الموضوع»); "Chapter" in the location line stays English; «جمّع الـ Bits» stays; `lg.q.predict.v101.hints[3]` takes «هذا هو الـ Gate، ومداخله (Inputs) هي {gateInputs}.»
