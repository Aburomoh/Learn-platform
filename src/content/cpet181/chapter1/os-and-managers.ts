/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 1, the operating system and its five managers (#555, content pack ch1 §5–6).
 * "Five managers" follows the pack (s.18 list, s.24, s.25). The Memory, Processor, Device, File and
 * Network Manager are asked by what each is in charge of and by its listed duties.
 */
import type { z } from "zod";
import type { TopicSchema } from "../../schema";
import { mcq, type Row } from "./mcq";

type TopicInput = z.input<typeof TopicSchema>;

const MANAGERS = ["Memory Manager", "Processor Manager", "Device Manager", "File Manager", "Network Manager"];
const others = (m: string) => MANAGERS.filter((x) => x !== m);

const OS_RULE = "The operating system is part of the software. It manages all the hardware and software, and controls every file, device, section of main memory and slice of processor time, and who may use the system and how.";

const whatIsOs: Row[] = [
  {
    prompt: "Which statement about the operating system is correct?",
    correct: "It manages all the hardware and software of the computer",
    wrong: ["It is a hardware part of the computer", "It manages only the files", "It manages only the keyboard and the monitor"],
    rule: OS_RULE,
    apply: "The OS manages all the hardware and software.",
    hint: "Is the OS a physical part, and does it look after one thing or everything?",
  },
  {
    prompt: "Which of these does the operating system control?",
    correct: "Who may use the system and how",
    wrong: ["Only the speed of the CPU clock", "Only the printer queue", "Only the shape of the case"],
    rule: OS_RULE,
    apply: "The OS controls who may use the system and how.",
    hint: "The OS controls the resources and the users of the whole system.",
  },
  {
    prompt: "Which list is everything the operating system controls?",
    correct: "Every file, device, section of main memory and slice of processor time",
    wrong: ["Only the files", "Only the devices and the files", "Only main memory"],
    rule: OS_RULE,
    apply: "The OS controls every file, device, section of main memory and slice of processor time.",
    hint: "\"Every\" is the key word: no resource is left out.",
  },
];

const softOrHard = (correct: string, wrong: string[]): Row => ({
  prompt: "Which of these is software?",
  correct,
  wrong,
  rule: "A computer is hardware (the physical parts) plus software (the encoded instructions). Operating systems such as Windows and applications such as the Microsoft Office package are software.",
  apply: `${correct.charAt(0).toUpperCase()}${correct.slice(1)} is software: encoded instructions, not a physical part.`,
  hint: "Software is instructions; hardware is something you can touch.",
});
const software: Row[] = [
  softOrHard("The operating system", ["The CPU", "The hard disk drive", "The keyboard"]),
  softOrHard("An application such as the Microsoft Office package", ["The monitor", "The CPU", "An SD card"]),
  softOrHard("Windows, an operating system", ["The printer", "The microphone", "Flash memory"]),
];

const inCharge = (manager: string, what: string, rule: string): Row => ({
  prompt: `Which manager is in charge of ${what}?`,
  correct: manager,
  wrong: others(manager),
  rule,
  apply: `${manager}: ${rule.charAt(0).toLowerCase()}${rule.slice(1)}`,
  hint: "Each manager is named after the resource it looks after.",
});
const charge: Row[] = [
  inCharge("Memory Manager", "main memory (RAM)", "The Memory Manager is in charge of main memory."),
  inCharge("Processor Manager", "allocating the CPU and tracking the status of each process", "The Processor Manager allocates the CPU and tracks process status."),
  inCharge("Device Manager", "devices, channels and control units", "The Device Manager is in charge of devices, channels and control units."),
  inCharge("File Manager", "every file: data, programs, compilers and applications", "The File Manager is in charge of every file."),
];

const duty = (manager: string, what: string, rule: string): Row => ({
  prompt: `Which manager ${what}?`,
  correct: manager,
  wrong: others(manager),
  rule,
  apply: `That is a duty of the ${manager}.`,
  hint: "Match the duty to the resource it protects.",
});
const duties: Row[] = [
  duty("Memory Manager", "checks that requests are valid and legal and keeps a tracking table", "The Memory Manager protects the OS's space, checks that requests are valid and legal, keeps a tracking table and deallocates to reclaim memory."),
  duty("File Manager", "enforces access restrictions and modification rights such as read-only, read-write, create and delete", "The File Manager enforces access restrictions and modification rights (read-only, read-write, create, delete); it allocates a file by opening it and deallocates by closing it."),
  duty("Processor Manager", "works on two levels, the Job Scheduler and the Process Scheduler", "The Processor Manager has two levels: the Job Scheduler admits jobs and the Process Scheduler runs the processes inside them."),
  duty("Network Manager", "shares hardware and software resources over a network while keeping user access control", "The Network Manager, the fifth manager, shares hardware and software resources in networked systems while keeping user access control."),
];

const common = (correct: string, wrong: string[]): Row => ({
  prompt: "Which duty do all the managers share?",
  correct,
  wrong,
  rule: "Every manager monitors its resources continuously, enforces the policy for who gets what, when and how much, allocates the resource and deallocates it.",
  apply: `Every manager does this: ${correct.charAt(0).toLowerCase()}${correct.slice(1)}.`,
  hint: "Pick the duty that every resource needs, not the one that belongs to a single resource.",
});
const shared: Row[] = [
  common("Monitor its resources continuously", ["Open and close files", "Admit jobs with the Job Scheduler", "Keep a tracking table of memory"]),
  common("Allocate its resource and deallocate it afterwards", ["Enforce read-only and read-write rights", "Check that memory requests are legal", "Choose the allocation of channels and control units only"]),
  common("Enforce the policy for who gets what, when and how much", ["Open and close files", "Run the Process Scheduler", "Protect the OS's space in memory"]),
];

export const osAndManagersTopic: TopicInput = {
  id: "os-and-managers",
  title: "The operating system and its managers",
  summary: "What an operating system is, and the five managers that run the computer's resources.",
  concepts: [
    { id: "os.what", title: "What an operating system is", summary: "Software that manages all the hardware and software." },
    { id: "mg.five", title: "The five managers", summary: "Memory, Processor, Device, File and Network Manager: what each is in charge of and what each does." },
  ],
  objectives: [
    { id: "os.obj.what", conceptId: "os.what", text: "Say what the operating system manages and controls." },
    { id: "os.obj.software", conceptId: "os.what", text: "Tell software from hardware." },
    { id: "mg.obj.charge", conceptId: "mg.five", text: "Say what each manager is in charge of." },
    { id: "mg.obj.duties", conceptId: "mg.five", text: "Match a duty to its manager." },
    { id: "mg.obj.shared", conceptId: "mg.five", text: "Name the duties every manager shares." },
  ],
  activities: [
    {
      id: "what-is-an-os",
      title: "What an operating system is",
      summary: "What the OS manages, and why it is software.",
      authority: "DEMO",
      minutes: 4,
      questions: [mcq("os.q.what", "What the OS does", "os.what", "os.obj.what", whatIsOs), mcq("os.q.software", "Software or hardware", "os.what", "os.obj.software", software, 1)],
    },
    {
      id: "five-managers",
      title: "The five managers",
      summary: "What each manager is in charge of and what it does.",
      authority: "DEMO",
      minutes: 8,
      questions: [
        mcq("mg.q.charge", "In charge of", "mg.five", "mg.obj.charge", charge),
        mcq("mg.q.duty", "Match the duty", "mg.five", "mg.obj.duties", duties, 2),
        mcq("mg.q.shared", "Shared duties", "mg.five", "mg.obj.shared", shared, 1),
      ],
    },
  ],
};
