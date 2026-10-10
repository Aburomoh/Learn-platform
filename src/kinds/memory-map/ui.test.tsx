import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { VariantSchema, type Activity, type Variant } from "@/content/schema";
import { createRunnerReducer, currentVariant, initialRunnerState, questionViewKey } from "@/stage/runnerReducer";
import { QuestionView } from "@/stage/QuestionView";
import { blockHeights } from "./MemoryMap";

const base = {
  hints: [{ rung: 2, text: "Not yet." }],
  explanation: [
    { id: "s1", say: "One." },
    { id: "s2", say: "Two." },
  ],
};
// Ch2 s.21: blocks 35, 20, 55, 30; P1 15, P2 25, P3 35, P4 20; first-fit: P1 → 35, P2 → 55, P3 waits, P4 → 20
const fixed: Variant = VariantSchema.parse({
  id: "v-fixed",
  prompt: "Place the processes with first-fit.",
  spec: { kind: "memory-map", scheme: "fixed", fit: "first", os: 10, partitions: [35, 20, 55, 30], jobs: [{ id: "P1", size: 15 }, { id: "P2", size: 25 }, { id: "P3", size: 35 }, { id: "P4", size: 20 }], events: [{ place: "P1" }, { place: "P2" }, { place: "P3" }, { place: "P4" }, { fragmentation: true }] },
  ...base,
});
const release: Variant = VariantSchema.parse({
  id: "v-release",
  prompt: "P2 finishes. Update the free list.",
  spec: { kind: "memory-map", scheme: "dynamic", fit: "first", os: 10, layout: [{ size: 12, job: "P1" }, { size: 8 }, { size: 16, job: "P2" }, { size: 4 }, { size: 20, job: "P3" }, { size: 30 }], jobs: [{ id: "P1", size: 12 }, { id: "P2", size: 16 }, { id: "P3", size: 20 }], events: [{ release: "P2" }] },
  ...base,
});
const compaction: Variant = VariantSchema.parse({
  id: "v-compact",
  prompt: "Compact memory.",
  spec: { kind: "memory-map", scheme: "relocatable", fit: "first", os: 10, layout: [{ size: 12, job: "P1" }, { size: 28 }, { size: 20, job: "P3" }, { size: 30 }], jobs: [{ id: "P1", size: 12 }, { id: "P3", size: 20 }], events: [{ compact: true }] },
  ...base,
});

function Harness({ variant }: { variant: Variant }) {
  const activity: Activity = { id: "mm", title: "Memory map", summary: "", authority: "DEMO", minutes: 1, questions: [{ id: "q", conceptId: "c", objectiveId: "o", variants: [variant] }] };
  const [state, dispatch] = useReducer(createRunnerReducer(activity), activity, (a) => createRunnerReducer(a)(initialRunnerState(a), { type: "OPEN" }));
  const v = currentVariant(activity, state);
  return <QuestionView key={questionViewKey(v, state)} variant={v} last={state.last} stepIndex={state.stepIndex} locked={state.tutor.stage === "complete"} explanation={null} onSubmit={(answer) => dispatch({ type: "SUBMIT", answer })} onPredict={() => {}} onContinue={() => {}} />;
}

const blocks = () => [...document.querySelectorAll("[data-column$='-before'] [data-block]")].map((b) => b.textContent);

describe("block heights", () => {
  it("are proportional with a 44 px floor and 120 px ceiling", () => {
    const h = blockHeights(10, [
      { start: 10, size: 100, job: null, jobSize: 0 },
      { start: 110, size: 5, job: null, jobSize: 0 },
    ]);
    expect(h.rows[1]).toBe(44);
    expect(h.rows[0]).toBeLessThanOrEqual(120);
    expect(h.os).toBe(44);
  });
});

describe("memory-map kind in the stage (#561)", () => {
  it("fixed first-fit: the free partitions are the radios; a right pick draws the job; a wrong one is marked; a job can wait", async () => {
    render(<Harness variant={fixed} />);
    const user = userEvent.setup();
    await screen.findByText(/Step 1 of 5 · Job P1 \(15 KB\), first-fit: which partition\?/);
    const group = screen.getByRole("radiogroup", { name: "Block for P1" });
    expect(within(group).getAllByRole("radio").map((r) => r.getAttribute("aria-label") ?? (r as HTMLInputElement).value)).toEqual(["Partition 1, 35 KB", "Partition 2, 20 KB", "Partition 3, 55 KB", "Partition 4, 30 KB", "waits"]);
    expect(within(group).getByRole("radio", { name: "Waits" })).toBeInTheDocument();
    // nothing computed is shown before the check: no waste numbers, no job in any partition
    expect(blocks().join("|")).not.toContain("P1");
    const place = screen.getByRole("button", { name: "Place job" });
    expect(place).toBeDisabled();

    await user.click(within(group).getByRole("radio", { name: "Partition 2, 20 KB" }));
    await user.click(place);
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    expect(document.querySelector("[data-block='1']")?.className).toMatch(/wrong/);

    await user.click(within(group).getByRole("radio", { name: "Partition 1, 35 KB" }));
    await user.click(screen.getByRole("button", { name: "Place job" }));
    await screen.findByText(/Step 2 of 5 · Job P2 \(25 KB\)/);
    expect(blocks()[0]).toContain("P1 · 15 KB");
    expect(blocks()[0]).not.toContain("waste");
    // the queue: P1 placed, P2 now
    const queue = screen.getByRole("list", { name: "Job queue" });
    expect(within(queue).getAllByRole("listitem").map((li) => li.getAttribute("data-status"))).toEqual(["placed", "now", "later", "later"]);

    await user.click(screen.getByRole("radio", { name: "Partition 3, 55 KB" }));
    await user.click(screen.getByRole("button", { name: "Place job" }));
    await screen.findByText(/Step 3 of 5 · Job P3 \(35 KB\)/);
    // P3 (35) fits nothing free (20, 30): Waits
    await user.click(screen.getByRole("radio", { name: "Waits" }));
    await user.click(screen.getByRole("button", { name: "Place job" }));
    await screen.findByText(/Step 4 of 5 · Job P4 \(20 KB\)/);
    expect(within(screen.getByRole("list", { name: "Job queue" })).getAllByRole("listitem").map((li) => li.getAttribute("data-status"))).toEqual(["placed", "placed", "waits", "now"]);
    await user.click(screen.getByRole("radio", { name: "Partition 2, 20 KB" }));
    await user.click(screen.getByRole("button", { name: "Place job" }));

    // waste column: inputs for the busy partitions only, in the partition table
    await screen.findByText(/Step 5 of 5 · Internal waste/);
    expect(screen.getAllByRole("textbox").map((t) => t.getAttribute("aria-label"))).toEqual(["Internal waste of partition 1", "Internal waste of partition 2", "Internal waste of partition 3"]);
    await user.type(screen.getByRole("textbox", { name: "Internal waste of partition 1" }), "20");
    await user.type(screen.getByRole("textbox", { name: "Internal waste of partition 2" }), "0");
    await user.type(screen.getByRole("textbox", { name: "Internal waste of partition 3" }), "30");
    await user.click(screen.getByRole("button", { name: "Check column" }));
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(blocks()[0]).toContain("waste 20");
    expect(screen.getByText(/Waiting: P3 \(35 KB\)/)).toBeInTheDocument();
  });

  it("dynamic release: start and size fields; the first wrong field is marked; a right answer merges the block", async () => {
    render(<Harness variant={release} />);
    const user = userEvent.setup();
    await screen.findByText(/P2 finishes and releases its block \(start 30, 16 KB\)/);
    expect(document.querySelector("[data-block='2']")?.className).toMatch(/releasing/);
    await user.type(screen.getByRole("textbox", { name: "Start" }), "30");
    await user.type(screen.getByRole("textbox", { name: "Size" }), "16");
    await user.click(screen.getByRole("button", { name: "Check release" }));
    expect(screen.getByText("Not correct yet.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Start" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox", { name: "Size" })).not.toHaveAttribute("aria-invalid");
    await user.clear(screen.getByRole("textbox", { name: "Start" }));
    await user.type(screen.getByRole("textbox", { name: "Start" }), "22");
    await user.clear(screen.getByRole("textbox", { name: "Size" }));
    await user.type(screen.getByRole("textbox", { name: "Size" }), "28");
    await user.click(screen.getByRole("button", { name: "Check release" }));
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(blocks()).toEqual(["P1 · 12 KB", "free · 28 KB", "P3 · 20 KB", "free · 30 KB"]);
    const free = screen.getByRole("table", { name: "Free list" });
    expect(within(free).getAllByRole("row").slice(1).map((r) => r.textContent)).toEqual(["2228free", "7030free"]);
  });

  it("compaction: an address per job, then a signed register; the after column fills in", async () => {
    render(<Harness variant={compaction} />);
    const user = userEvent.setup();
    await screen.findByText("Step 1 of 3");
    await screen.findByText(/After compaction, where does P1 start\?/);
    // P1 does not move (10 → 10): still asked, no register for it
    await user.type(screen.getByRole("textbox", { name: /where does P1 start/ }), "10");
    await user.click(screen.getByRole("button", { name: "Check address" }));
    await screen.findByText("Step 2 of 3");
    expect([...document.querySelectorAll("[data-column$='-after'] [data-block]")].map((b) => b.textContent)).toEqual(["P1 12", "P3 → ?", "?"]);
    await user.type(screen.getByRole("textbox", { name: /where does P3 start/ }), "22");
    await user.click(screen.getByRole("button", { name: "Check address" }));
    await screen.findByText("Step 3 of 3");
    await screen.findByText(/Relocation register of P3 \(bytes\)/);
    expect([...document.querySelectorAll("[data-column$='-after'] [data-block]")].map((b) => b.textContent)).toEqual(["P1 12", "P3 20", "free 58"]);
    const field = screen.getByRole("textbox", { name: /Relocation register of P3/ });
    await user.type(field, "−{Enter}"); // a lone minus is not an attempt (#574)
    expect(screen.queryByText("Not correct yet.")).toBeNull();
    expect(screen.getByRole("button", { name: "Check register" })).toBeDisabled();
    await user.type(field, "28672"); // U+2212 is accepted
    await user.click(screen.getByRole("button", { name: "Check register" }));
    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(screen.getByText(/P3: -28 KB × 1024 = -28672/)).toBeInTheDocument();
  });
});
