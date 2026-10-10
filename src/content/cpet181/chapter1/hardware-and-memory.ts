/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 1, hardware and memory (#555, content pack ch1 §1–2): the hardware categories
 * from the slide examples, and RAM vs ROM on the four rows the course compares (stands for, what it
 * is, use, volatility).
 */
import type { z } from "zod";
import type { TopicSchema } from "../../schema";
import { mcq, type Row } from "./mcq";

type TopicInput = z.input<typeof TopicSchema>;

const CATEGORIES = ["Input device", "Output device", "Secondary memory (storage)", "CPU"];
const sort = (device: string, category: string, rule: string): Row => ({
  prompt: `Which hardware category is a ${device}?`,
  correct: category,
  wrong: CATEGORIES.filter((c) => c !== category),
  rule,
  apply: `A ${device} is ${category === "CPU" ? "the CPU" : `an example of ${category.toLowerCase()}`}.`,
  hint: "Ask what the device does: it sends data in, shows or prints results, keeps data, or runs instructions.",
});
const IN = "Input devices send data to the computer: mouse, keyboard, microphone, camera, scanner, barcode reader.";
const OUT = "Output devices present results: monitor, printer, projector, speakers.";
const SEC = "Secondary memory keeps data: hard disk drive, SD card, flash memory, CD/DVD.";

const hardwareSort = mcq("hw.q.sort", "Sort a device", "hw.categories", "hw.obj.sort", [
  sort("keyboard", "Input device", IN),
  sort("printer", "Output device", OUT),
  sort("hard disk drive", "Secondary memory (storage)", SEC),
  sort("scanner", "Input device", IN),
]);

const CPU_WRONG = ["Monitor", "Hard disk drive", "Keyboard", "Printer", "SD card"];
const cpuRow = (prompt: string, wrong: string[], rule: string): Row => ({
  prompt,
  correct: "CPU",
  wrong,
  rule,
  apply: "That is the CPU, the computer's brain.",
  hint: "One part is called the computer's brain; the others only send data in, show it or keep it.",
});
const cpuQuestion = mcq("hw.q.cpu", "The CPU", "hw.categories", "hw.obj.cpu", [
  cpuRow("Which part is the computer's \"brain\"?", CPU_WRONG.slice(0, 3), "The CPU is the computer's brain."),
  cpuRow("Which part interprets and executes instructions?", [CPU_WRONG[3], CPU_WRONG[0], CPU_WRONG[4]], "The CPU interprets and executes instructions."),
  cpuRow("Which part starts every storage reference, data operation and I/O operation?", [CPU_WRONG[2], CPU_WRONG[4], CPU_WRONG[1]], "The CPU starts every storage reference, data operation and I/O operation."),
], 1);

const SECONDARY = ["Hard disk drive", "SD card", "Flash memory", "CD/DVD"];
const NOT_SECONDARY = ["Mouse", "Monitor", "Microphone", "Projector"];
const secondary = (correct: string, wrong: string[]): Row => ({
  prompt: "Which of these is secondary memory?",
  correct,
  wrong,
  rule: "Memory is primary (RAM, ROM) or secondary. Secondary memory is the long-term storage: hard disk drive, SD card, flash memory, CD/DVD.",
  apply: `${correct} is secondary memory.`,
  hint: "Secondary memory keeps data for the long term; the others send data in or show it.",
});
const secondaryQuestion = mcq("hw.q.secondary", "Secondary memory", "hw.categories", "hw.obj.secondary", [
  secondary(SECONDARY[0], NOT_SECONDARY.slice(0, 3)),
  secondary(SECONDARY[1], [NOT_SECONDARY[3], NOT_SECONDARY[1], NOT_SECONDARY[2]]),
  secondary(SECONDARY[2], [NOT_SECONDARY[2], NOT_SECONDARY[0], NOT_SECONDARY[3]]),
  secondary(SECONDARY[3], [NOT_SECONDARY[1], NOT_SECONDARY[3], NOT_SECONDARY[0]]),
], 2);

/* ---------- RAM vs ROM ---------- */

const RR = "RAM is Random Access Memory: volatile read/write storage. ROM is Read-Only Memory: non-volatile, it holds the start-up (boot) instructions.";

const stands: Row[] = [
  {
    prompt: "What does RAM stand for?",
    correct: "Random Access Memory",
    wrong: ["Read-Only Memory", "Random Only Memory", "Read Access Memory"],
    rule: "RAM stands for Random Access Memory.",
    apply: "RAM = Random Access Memory: it can be reached in any order.",
    hint: "The R in RAM is not \"read\": it describes the way the memory is reached.",
  },
  {
    prompt: "What does ROM stand for?",
    correct: "Read-Only Memory",
    wrong: ["Random Access Memory", "Random Only Memory", "Read Access Memory"],
    rule: "ROM stands for Read-Only Memory.",
    apply: "ROM = Read-Only Memory: the computer can only read it.",
    hint: "Think about what the computer is allowed to do with this memory.",
  },
  {
    prompt: "Which name goes with the memory that holds the start-up instructions?",
    correct: "ROM: Read-Only Memory",
    wrong: ["RAM: Random Access Memory", "ROM: Random Only Memory", "RAM: Read Access Memory"],
    rule: "ROM, Read-Only Memory, holds the start-up (boot) instructions.",
    apply: "The start-up instructions sit in ROM: Read-Only Memory.",
    hint: "Both the short name and the full name must match.",
  },
];

const what: Row[] = [
  {
    prompt: "Which memory holds the start-up (boot) instructions?",
    correct: "ROM",
    wrong: ["RAM"],
    rule: RR,
    apply: "ROM holds the boot instructions.",
    hint: "Which of the two is kept when the power is off?",
  },
  {
    prompt: "Which memory is read/write storage that can be reached in any order at any time?",
    correct: "RAM",
    wrong: ["ROM"],
    rule: RR,
    apply: "RAM is read/write storage reachable in any order at any time.",
    hint: "One of the two can be written to; the other is only read.",
  },
  {
    prompt: "Which memory can the computer only read, never write?",
    correct: "ROM",
    wrong: ["RAM"],
    rule: RR,
    apply: "ROM is read only.",
    hint: "The name of the memory says what you may do with it.",
  },
];

const use: Row[] = [
  {
    prompt: "Which memory gives fast read and write while applications run?",
    correct: "RAM",
    wrong: ["ROM"],
    rule: "RAM is used for fast read/write while applications run. ROM is read only and boots the computer.",
    apply: "Running applications read and write RAM.",
    hint: "Applications need to write data as they run.",
  },
  {
    prompt: "Which memory is used to boot the computer?",
    correct: "ROM",
    wrong: ["RAM"],
    rule: "RAM is used for fast read/write while applications run. ROM is read only and boots the computer.",
    apply: "ROM is read only and boots the computer.",
    hint: "Booting happens before any application is running.",
  },
  {
    prompt: "An application is running and keeps changing its data. Where does that data live?",
    correct: "RAM",
    wrong: ["ROM"],
    rule: "RAM is used for fast read/write while applications run. ROM is read only and boots the computer.",
    apply: "Data that keeps changing needs read/write memory: RAM.",
    hint: "Data that changes must be written, not only read.",
  },
];

const volatility: Row[] = [
  {
    prompt: "Which memory is volatile: its contents are lost at power-off?",
    correct: "RAM",
    wrong: ["ROM"],
    rule: "RAM is volatile (lost at power-off). ROM is non-volatile (kept at power-off).",
    apply: "RAM loses its contents at power-off.",
    hint: "The boot instructions must still be there the next time you switch on.",
  },
  {
    prompt: "Which memory keeps its contents when the power is off?",
    correct: "ROM",
    wrong: ["RAM"],
    rule: "RAM is volatile (lost at power-off). ROM is non-volatile (kept at power-off).",
    apply: "ROM is non-volatile: it keeps its contents at power-off.",
    hint: "Non-volatile means the contents stay.",
  },
  {
    prompt: "The computer is switched off. What happens to what was stored in RAM?",
    correct: "It is lost",
    wrong: ["It is kept"],
    rule: "RAM is volatile (lost at power-off). ROM is non-volatile (kept at power-off).",
    apply: "RAM is volatile, so its contents are lost at power-off.",
    hint: "Is RAM volatile or non-volatile?",
  },
];

export const hardwareAndMemoryTopic: TopicInput = {
  id: "hardware-and-memory",
  title: "Hardware and memory",
  summary: "The hardware categories, the CPU, primary and secondary memory, and RAM against ROM.",
  concepts: [
    { id: "hw.categories", title: "Hardware categories", summary: "Input devices, output devices, the CPU and memory (primary and secondary)." },
    { id: "rr.compare", title: "RAM vs ROM", summary: "RAM is volatile read/write storage; ROM is non-volatile and holds the boot instructions." },
  ],
  objectives: [
    { id: "hw.obj.sort", conceptId: "hw.categories", text: "Sort a device into input, output, secondary memory or CPU." },
    { id: "hw.obj.cpu", conceptId: "hw.categories", text: "Say what the CPU does." },
    { id: "hw.obj.secondary", conceptId: "hw.categories", text: "Name secondary memory devices." },
    { id: "rr.obj.stands", conceptId: "rr.compare", text: "Give what RAM and ROM stand for." },
    { id: "rr.obj.what", conceptId: "rr.compare", text: "Say what RAM and ROM are." },
    { id: "rr.obj.use", conceptId: "rr.compare", text: "Say what RAM and ROM are used for." },
    { id: "rr.obj.volatile", conceptId: "rr.compare", text: "Say which is volatile and which is non-volatile." },
  ],
  activities: [
    {
      id: "hardware-categories",
      title: "Hardware categories",
      summary: "Sort devices and name the parts of the computer.",
      authority: "DEMO",
      minutes: 5,
      questions: [hardwareSort, cpuQuestion, secondaryQuestion],
    },
    {
      id: "ram-vs-rom",
      title: "RAM vs ROM",
      summary: "Compare the two on name, definition, use and volatility.",
      authority: "DEMO",
      minutes: 6,
      questions: [
        mcq("rr.q.stands", "What it stands for", "rr.compare", "rr.obj.stands", stands),
        mcq("rr.q.what", "What it is", "rr.compare", "rr.obj.what", what, 1),
        mcq("rr.q.use", "What it is used for", "rr.compare", "rr.obj.use", use),
        mcq("rr.q.volatility", "Volatility", "rr.compare", "rr.obj.volatile", volatility, 1),
      ],
    },
  ],
};
