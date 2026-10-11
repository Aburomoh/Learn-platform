import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { courses } from "@/content";
import { en } from "@/tutor/messages/en";

/**
 * Drift guard (ADR-0011 §7, Reviewer on #653): the supportive strings on this branch that have no
 * Arabic are counted here, so `docs/localization/ar/UNTRANSLATED.md` cannot go stale silently. The
 * fields are the inventory's: hints (every ladder), explanation steps, prediction follow-ups,
 * per-variant reactions, and the tutor catalog. Untranslated text is not a blocker (it falls back to
 * English); a stale report is. When this fails, regenerate UNTRANSLATED.md (Content Engineer) or
 * fix the count there.
 */
const DIR = path.resolve(process.cwd(), "docs/localization/ar");
const arabic = JSON.parse(readFileSync(path.join(DIR, "source-texts.ar.json"), "utf8")) as { english: string; arabic?: string }[];
const translated = new Set(arabic.filter((e) => e.arabic?.trim()).map((e) => e.english));

function supportiveStrings(): Set<string> {
  const out = new Set<string>();
  for (const course of courses)
    for (const mod of course.modules)
      for (const topic of mod.topics)
        for (const activity of topic.activities)
          for (const q of activity.questions)
            for (const v of q.variants) {
              for (const h of v.hints) out.add(h.text);
              for (const ladder of Object.values(v.hintsByStep ?? {})) for (const h of ladder) out.add(h.text);
              for (const s of v.explanation) {
                out.add(s.say);
                if (s.ask?.afterCorrect) out.add(s.ask.afterCorrect);
                if (s.ask?.afterWrong) out.add(s.ask.afterWrong);
              }
              for (const r of Object.values(v.reactions ?? {})) if (typeof r === "string") out.add(r);
            }
  return out;
}

describe("Arabic coverage of the supportive text on this branch", () => {
  it("UNTRANSLATED.md reports the current count of supportive strings without Arabic", () => {
    const strings = supportiveStrings();
    const missing = [...strings].filter((s) => !translated.has(s));
    const report = readFileSync(path.join(DIR, "UNTRANSLATED.md"), "utf8");
    const documented = Number(/Without Arabic: \*\*(\d+)\*\*/.exec(report)?.[1]);
    const message = `${missing.length} supportive strings have no Arabic (UNTRANSLATED.md says ${documented}). ${
      missing.length > documented ? "New or changed supportive text since the report: " : "The report is ahead of the content: "
    }${missing.slice(0, 5).map((s) => JSON.stringify(s.slice(0, 60))).join(", ")}`;
    expect(missing.length, message).toBe(documented);
  });

  it("every tutor catalog key has Arabic", () => {
    const missing = Object.entries(en).filter(([, text]) => !translated.has(text)).map(([k]) => k);
    // the templates added by #650 (component sentences) are the known exceptions until the owner translates them
    const added = missing.filter((k) => !k.startsWith("ui."));
    expect(added).toEqual([]);
  });
});
