import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { getCourse } from "@/content";
import { _setPrefs } from "@/learner/store";
import { clearLocalData } from "@/learner";
import { _resetArabic, _setArabicMap, SHARED } from "@/l10n/arabic";
import { messageTemplate } from "@/tutor/messages";
import { ActivitySummary } from "@/stage/ActivitySummary";
import { NumericInput } from "@/interactions/NumericInput/NumericInput";
import { courseAction, topicRowLink } from "../primaryAction";
import { TopBar, TopicRow } from "./Chrome";
import { LocationLine } from "./LocationLine";
import { PrimaryAction } from "./PrimaryAction";
import { TopicNext } from "./TopicNext";
import { UiText } from "./uiText";

// Navigation, summary and numeric strings through the Arabic layer (#705, ADR-0011). The Arabic here
// is test data, not approved copy: the maps are put in memory, nothing is fetched or shipped.
const course = getCourse("ecet111")!;
const topics = course.modules.flatMap((m) => m.topics);
const multi = topics.find((t) => t.activities.length > 1)!;
const empty = { activities: {} };

const AR: Record<string, string> = {
  [messageTemplate("ui.action.start")]: "ابدأ · {title}",
  [messageTemplate("ui.action.open-topic")]: "افتح الموضوع",
  [messageTemplate("ui.action.recommended")]: "الخطوة التالية المقترحة",
  [messageTemplate("ui.row.more")]: "أخرى: {n}",
  [messageTemplate("ui.nav.here")]: "أنت هنا",
  [messageTemplate("ui.nav.show-path")]: "أظهر المسار كاملاً",
  [messageTemplate("ui.nav.all-courses")]: "المقررات",
  [messageTemplate("ui.kind.repeated-division")]: "قسمة خطوة بخطوة",
  [messageTemplate("ui.summary.line")]: "{activity}. التحديات: {challenges}، المحاولات: {attempts}، {hints}.",
  [messageTemplate("ui.summary.challenges.other")]: "{n}",
  [messageTemplate("ui.summary.attempts.other")]: "{n}",
  [messageTemplate("ui.summary.hints.zero")]: "لم تحتج إلى تلميحات",
  [messageTemplate("ui.numeric.decimal.signed")]: "الأرقام من 0 إلى 9 وعلامة ناقص في البداية",
};

const arabicOn = () => {
  _setArabicMap(SHARED, AR);
  act(() => {
    _setPrefs({ locale: "ar" });
  });
};

beforeEach(() => {
  _resetArabic();
  act(() => {
    _setPrefs({ locale: "en" });
  });
});
afterEach(() => {
  act(() => {
    clearLocalData();
  });
});

describe("UiText and the resolver's labels", () => {
  it("English, or no Arabic for the key: the text exactly as before, no dir or lang", () => {
    const first = render(<UiText k="ui.action.recommended" />);
    expect(screen.getByText("Recommended next")).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeNull();
    first.unmount();
    arabicOn();
    render(<UiText k="ui.nav.courses-moved" />);
    expect(screen.getByText("The courses are listed on the home page.")).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeNull();
  });

  it("Arabic on: the action label is Arabic on a text element, the English title an isolated LTR run", () => {
    arabicOn();
    const action = courseAction(course, empty);
    render(<PrimaryAction primary={action.primary} caption={<UiText k="ui.action.recommended" />} />);
    const link = document.querySelector("[data-primary-action]")!;
    const ar = link.querySelector("[dir='rtl'][lang='ar']")!;
    expect(ar).not.toBeNull();
    expect(ar.textContent).toBe(`ابدأ · ${action.activity.title}`);
    expect(within(ar as HTMLElement).getByText(action.activity.title).closest("bdi")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText("الخطوة التالية المقترحة").closest("[dir='rtl']")).not.toBeNull();
    // the resolver's English label is untouched: the lookup key rides beside it
    expect(action.primary.label).toBe(`Start · ${action.activity.title}`);
    expect(action.primary.template).toBe("Start · {title}");
  });

  it("the quiet row action: Arabic text, the accessible name says the row in the same language", () => {
    arabicOn();
    render(
      <ol>
        <TopicRow title={multi.title} action={topicRowLink(course, multi, empty)} />
      </ol>,
    );
    const link = screen.getByRole("link", { name: `افتح الموضوع: ${multi.title}` });
    expect(link.querySelector("[dir='rtl'][lang='ar']")).toHaveTextContent("افتح الموضوع");
  });

  it("'+N more' is Arabic with a Western digit, on a line that never breaks", () => {
    arabicOn();
    render(
      <ol>
        <TopicRow title="T" action={{ label: "x", href: "/" }} practices={["A", "B", "C", "D", "E", "F"]} />
      </ol>,
    );
    const wide = document.querySelector("[class*='moreWide']")!;
    const narrow = document.querySelector("[class*='moreNarrow']")!;
    expect(wide).toHaveTextContent("أخرى: 2");
    expect(narrow).toHaveTextContent("أخرى: 4");
    // the digit is an isolated LTR run inside the Arabic text element
    expect(wide.querySelector("[dir='rtl'][lang='ar'] bdi[dir='ltr']")).toHaveTextContent("2");
  });

  it("the top bar's back text: dir from the language on the clipped element itself; a course code stays plain", () => {
    arabicOn();
    render(<TopBar back={{ label: "All courses", href: "/#courses", template: messageTemplate("ui.nav.all-courses") }} />);
    const back = screen.getByRole("link", { name: "المقررات" });
    const span = back.querySelector("span")!;
    expect(span).toHaveAttribute("dir", "rtl");
    expect(span).toHaveAttribute("lang", "ar");
    expect(screen.getByRole("banner")).not.toHaveAttribute("dir");
    render(<TopBar back={{ label: "ECET 111", href: "/courses/ecet111/" }} />);
    expect(screen.getByRole("link", { name: "ECET 111" }).querySelector("span")).not.toHaveAttribute("dir");
  });

  it("the location line's accessible names follow the language; the segments stay English", () => {
    arabicOn();
    render(<LocationLine segments={[{ label: "ECET 111", href: "/courses/ecet111/" }, { label: "Chapter 1", href: "/x" }, { label: "Binary arithmetic" }]} />);
    expect(screen.getByRole("navigation", { name: "أنت هنا" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "أظهر المسار كاملاً" })).toBeInTheDocument();
    expect(screen.getByText("Binary arithmetic")).not.toHaveAttribute("dir");
  });

  it("topic page rows: each kind word through the layer; data-kinds and the English fallback unchanged", () => {
    arabicOn();
    render(<TopicNext course={course} topic={multi} />);
    const rows = within(screen.getByRole("region", { name: "Practices in this topic" })).getAllByRole("listitem");
    const division = rows.find((r) => r.getAttribute("data-kinds")?.includes("Step-by-step division"))!;
    expect(division).toBeDefined();
    expect(division.querySelector("[dir='rtl'][lang='ar']")).toHaveTextContent("قسمة خطوة بخطوة");
    // a kind without Arabic keeps its English words
    expect(division.textContent).toMatch(/Type the number|Group the bits|Choose the answer|Add column by column/);
  });

  it("the summary sentence: Arabic around the English title, the counts as Western digits", () => {
    arabicOn();
    const activity = multi.activities[0];
    const next = courseAction(course, empty);
    render(<ActivitySummary activity={activity} objectives={[]} attempts={7} hintsUsed={0} next={next} topicHref="/t/" onRestart={() => {}} />);
    const line = screen.getByText(/التحديات/).closest("[dir='rtl'][lang='ar']")!;
    expect(line.textContent).toBe(`${activity.title}. التحديات: ${activity.questions.length}، المحاولات: 7، لم تحتج إلى تلميحات.`);
    expect(within(line as HTMLElement).getByText(activity.title).closest("bdi")).toHaveAttribute("dir", "ltr");
  });

  it("a translation with no Arabic letters of its own ('+{n}', a label:value line) is still the translation (#710)", () => {
    _setArabicMap(SHARED, { [messageTemplate("ui.row.more")]: "+{n}", [messageTemplate("ui.summary.line")]: "{activity} · {challenges} · {attempts} · {hints}", [messageTemplate("ui.summary.attempts.other")]: "المحاولات: {n}" });
    act(() => {
      _setPrefs({ locale: "ar" });
    });
    render(
      <ol>
        <TopicRow title="T" action={{ label: "x", href: "/" }} practices={["A", "B", "C", "D", "E", "F"]} />
      </ol>,
    );
    expect(document.querySelector("[class*='moreWide']")).toHaveTextContent("+2");
    expect(document.querySelector("[class*='moreWide']")).not.toHaveTextContent("more");
    const activity = multi.activities[0];
    render(<ActivitySummary activity={activity} objectives={[]} attempts={7} hintsUsed={2} next={courseAction(course, empty)} topicHref="/t/" onRestart={() => {}} />);
    // the line itself has no Arabic letters, but a filled slot does: Arabic text element, title isolated
    const line = screen.getByText(/المحاولات/).closest("[dir='rtl'][lang='ar']")!;
    expect(line.textContent).toContain(`${activity.title} · `);
    expect(line.textContent).toContain("المحاولات: 7");
  });

  it("status and effort lines read through the layer; their English is unchanged (#710)", () => {
    _setArabicMap(SHARED, { [messageTemplate("ui.topic.practices-in")]: "التمارين في هذا الموضوع", [messageTemplate("ui.effort.minutes")]: "حوالي {n} دقيقة", [messageTemplate("ui.summary.title")]: "اكتمل التمرين" });
    act(() => {
      _setPrefs({ locale: "ar" });
    });
    render(<TopicNext course={course} topic={multi} />);
    expect(screen.getByRole("heading", { level: 2, name: "التمارين في هذا الموضوع" })).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/حوالي \d+ دقيقة/);
    render(<ActivitySummary activity={multi.activities[0]} objectives={["x"]} attempts={1} hintsUsed={0} next={courseAction(course, empty)} topicHref="/t/" onRestart={() => {}} />);
    expect(screen.getByRole("heading", { level: 2, name: "اكتمل التمرين" })).toBeInTheDocument();
  });

  it("a label:value phrase never splits: the label and its number share one nowrap span (#705)", () => {
    _setArabicMap(SHARED, { [messageTemplate("ui.summary.line")]: "{activity} · التحديات: {challenges} · المحاولات: {attempts} · {hints}", [messageTemplate("ui.summary.attempts.other")]: "{n}", [messageTemplate("ui.summary.challenges.other")]: "{n}", [messageTemplate("ui.summary.hints.zero")]: "بلا تلميحات" });
    act(() => {
      _setPrefs({ locale: "ar" });
    });
    const activity = multi.activities[0];
    render(<ActivitySummary activity={activity} objectives={[]} attempts={7} hintsUsed={0} next={courseAction(course, empty)} topicHref="/t/" onRestart={() => {}} />);
    const pairs = [...document.querySelectorAll("[class*='pair']")].map((el) => el.textContent);
    expect(pairs).toContain("المحاولات: 7");
    expect(pairs).toContain(`التحديات: ${activity.questions.length}`);
    for (const el of document.querySelectorAll("[class*='pair']")) expect(el.querySelector("bdi[dir='ltr']")).not.toBeNull();
  });

  it("the rest of the chrome reads its #702 keys: Home headings, the footer, the skip menu's destination and the hint panel (#705)", async () => {
    _setArabicMap(SHARED, {
      [messageTemplate("ui.home.start-here")]: "ابدأ من هنا",
      [messageTemplate("ui.home.your-courses")]: "مقرراتك",
      [messageTemplate("ui.home.open-course")]: "افتح المقرر: {title}",
      [messageTemplate("ui.foot.optional")]: "تدريب اختياري، بلا درجات",
      [messageTemplate("ui.hint.rung-2")]: "تلميح أولي",
      [messageTemplate("ui.hint.button")]: "تلميح",
      [messageTemplate("ui.skip.confirm-note")]: "تخطّي هذا السؤال؟ الوجهة: {targetLabel}.",
      [messageTemplate("ui.skip.target.practice")]: "التمرين التالي: {title}",
    });
    act(() => {
      _setPrefs({ locale: "ar" });
    });
    const { HomeNext } = await import("./HomeNext");
    const { Footer } = await import("./Chrome");
    const { HintReveal } = await import("@/interactions/HintReveal/HintReveal");
    const { SkipMenu } = await import("@/stage/SkipMenu");
    render(<HomeNext courses={[course, { ...course, id: "other", offeringId: "o" }]} />);
    expect(screen.getByRole("heading", { level: 1, name: "ابدأ من هنا" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "مقرراتك" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: `افتح المقرر: ${course.title}` }).length).toBeGreaterThan(0);
    render(<Footer demo={false} />);
    expect(screen.getByText("تدريب اختياري، بلا درجات")).toBeInTheDocument();
    render(<HintReveal revealed={[{ rung: 2, text: "Not yet." }]} canRequest onRequest={() => {}} />);
    expect(screen.getByText("تلميح أولي")).toBeInTheDocument();
    render(<SkipMenu allowed targetLabel="the next practice, Binary addition" target={{ key: "ui.skip.target.practice", vars: { title: "Binary addition" } }} onSkip={() => {}} />);
    screen.getByRole("button", { name: "More" }).click();
    await act(async () => {});
    screen.getAllByRole("button").find((b) => b.textContent?.includes("Skip to next question"))?.click();
    await act(async () => {});
    expect(document.body.textContent).toContain("الوجهة: التمرين التالي: Binary addition");
  });

  it("the numeric hint: the catalogue part of the sentence is Arabic", () => {
    arabicOn();
    // the signed and decimal-places shapes are catalogue sentences; the plain base hints are not (ADR-0011 §6)
    render(<NumericInput id="n" prompt="x" base={10} signed onAnswer={() => {}} />);
    expect(document.querySelector("[dir='rtl'][lang='ar']")).toHaveTextContent("الأرقام من 0 إلى 9 وعلامة ناقص في البداية");
    expect(document.body.textContent).toContain("Enter a decimal value (الأرقام من 0 إلى 9 وعلامة ناقص في البداية).");
  });

  it("English fallback is byte-for-byte: the summary and the hint read as before with Arabic off", () => {
    const activity = multi.activities[0];
    render(<ActivitySummary activity={activity} objectives={[]} attempts={7} hintsUsed={2} next={courseAction(course, empty)} topicHref="/t/" onRestart={() => {}} />);
    expect(screen.getByText(`${activity.title}: ${activity.questions.length} challenges, 7 attempts, hints used on 2 challenges.`)).toBeInTheDocument();
    render(<NumericInput id="n" prompt="x" base={10} signed onAnswer={() => {}} />);
    expect(screen.getByText("Enter a decimal value (digits 0 to 9, a leading minus sign).")).toBeInTheDocument();
    expect(document.querySelector("[dir='rtl']")).toBeNull();
  });
});
