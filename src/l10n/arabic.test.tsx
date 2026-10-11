import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { usePrefs } from "@/learner";
import { _setPrefs } from "@/learner/store";
import { _resetArabic, _setArabicMap, arabicFor, loadArabic, SHARED } from "./arabic";
import { SupportiveText } from "./SupportiveText";

/** A fetch that serves an index and two maps, counting the requests. */
function fakeFetch(files: Record<string, unknown>) {
  const calls: string[] = [];
  const fetch = vi.fn(async (url: string, _init?: RequestInit) => {
    calls.push(url);
    const body = files[url];
    return body === undefined ? new Response("", { status: 404 }) : new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  return { fetch, calls };
}

function Probe({ template, course }: { template: string; course?: string }) {
  const [, setPrefs] = usePrefs();
  return (
    <>
      <button type="button" onClick={() => setPrefs({ locale: "ar" })}>
        ar
      </button>
      <p data-testid="out">
        <SupportiveText template={template} vars={{ n: 3 }} course={course} />
      </p>
    </>
  );
}

describe("Arabic lookup and fallback (ADR-0011 §2–3)", () => {
  beforeEach(() => {
    _resetArabic();
    _setPrefs({ locale: "en" });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("looks up by the exact English template, course map first, then shared; a miss is undefined", () => {
    _setArabicMap(SHARED, { "Good. Next step.": "جيد. الخطوة التالية." });
    _setArabicMap("ecet111", { "Look at {bits}.": "انظر إلى {bits}.", "Good. Next step.": "course wins" });
    expect(arabicFor("Look at {bits}.", "ecet111")).toBe("انظر إلى {bits}.");
    expect(arabicFor("Good. Next step.", "ecet111")).toBe("course wins");
    expect(arabicFor("Good. Next step.")).toBe("جيد. الخطوة التالية.");
    expect(arabicFor("Look at {bits}.", "cpet181")).toBeUndefined();
    expect(arabicFor("Never translated")).toBeUndefined();
  });

  it("fetches the index with no-cache and then the hashed map, once per map; nothing is fetched while English is on", async () => {
    const { fetch, calls } = fakeFetch({
      "/l10n/ar/index.json": { shared: "shared.abc.json", ecet111: "ecet111.def.json" },
      "/l10n/ar/shared.abc.json": { "Not yet.": "ليس بعد." },
      "/l10n/ar/ecet111.def.json": { "Count the 1s: {n}.": "عُدّ الآحاد: {n}." },
    });
    vi.stubGlobal("fetch", fetch);
    render(<Probe template="Count the 1s: {n}." course="ecet111" />);
    expect(screen.getByTestId("out")).toHaveTextContent("Count the 1s: 3.");
    expect(calls).toEqual([]);

    await act(async () => {
      screen.getByRole("button", { name: "ar" }).click();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(calls[0]).toBe("/l10n/ar/index.json");
    expect(fetch.mock.calls[0][1]).toMatchObject({ cache: "no-cache" });
    expect(new Set(calls)).toEqual(new Set(["/l10n/ar/index.json", "/l10n/ar/shared.abc.json", "/l10n/ar/ecet111.def.json"]));
    expect(calls.length).toBe(3);
    // the map landed: the same component now shows the Arabic with the slot filled
    await waitFor(() => expect(screen.getByTestId("out").textContent).toBe("عُدّ الآحاد: 3."));
    expect(screen.getByTestId("out").querySelector("[dir='rtl'][lang='ar']")).not.toBeNull();
    // a second load of the same map is a no-op
    await loadArabic("ecet111");
    expect(calls.length).toBe(3);
  });

  it("a missing or failing map falls back to English for the page's life, without throwing", async () => {
    const { fetch } = fakeFetch({ "/l10n/ar/index.json": { shared: "shared.abc.json" } });
    vi.stubGlobal("fetch", fetch);
    _setPrefs({ locale: "ar" });
    await loadArabic("cpet181");
    await loadArabic(SHARED); // 404 on the file itself
    expect(arabicFor("Not yet.", "cpet181")).toBeUndefined();
    render(<SupportiveText template="Not yet." course="cpet181" />);
    expect(screen.getByText("Not yet.")).toBeInTheDocument();
  });
});
