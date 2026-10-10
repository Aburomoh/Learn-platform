/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 1, user interfaces and types of operating system (#555, content pack ch1 §7–8).
 * Real-time examples are asked as "real-time" (the pack does not split them into hard and soft);
 * the hard/soft split is asked only by what a missed deadline causes.
 */
import type { z } from "zod";
import type { TopicSchema } from "../../schema";
import { mcq, type Row } from "./mcq";

type TopicInput = z.input<typeof TopicSchema>;

const UI_RULE = "A GUI takes input from a pointing device (mouse, finger) and is easy to use. A command line takes typed commands that can be chained into one powerful command, but it needs exact spelling, correct syntax and the correct combination.";
const ui = (prompt: string, correct: "GUI" | "Command line", apply: string, hint: string): Row => ({
  prompt,
  correct: correct === "GUI" ? "GUI (graphical user interface)" : "Command line",
  wrong: [correct === "GUI" ? "Command line" : "GUI (graphical user interface)"],
  rule: UI_RULE,
  apply,
  hint,
});
const input: Row[] = [
  ui("Which interface takes its input from a pointing device such as a mouse?", "GUI", "A pointing device (mouse, finger) drives a GUI.", "Think about what you click or touch."),
  ui("Which interface takes its input as typed commands?", "Command line", "Typed commands are the command line.", "Think about what you type."),
  ui("You tap an icon with your finger. Which interface is this?", "GUI", "A finger on the screen is a pointing device, so this is a GUI.", "A finger is a pointing device."),
];
const strength: Row[] = [
  ui("Which interface lets you chain commands into one powerful command?", "Command line", "Commands typed on a command line can be chained into one powerful command.", "Chaining needs typed commands."),
  ui("Which interface is easy to use, with menus that vary by operating system?", "GUI", "Menus belong to the GUI, and they vary by OS.", "Menus are something you point at."),
  ui("Which interface demands exact spelling, correct syntax and the correct combination of commands?", "Command line", "A typed command must be exactly right, so the command line demands exact spelling and syntax.", "Which interface do you type into?"),
];

const TYPES = ["Batch", "Interactive", "Real-time", "Hybrid", "Embedded"];
const OS_TYPES = "Batch: jobs entered whole and in sequence, one finishing before the next starts. Interactive: several jobs in progress with faster response than batch. Real-time: a strict deadline every time. Hybrid: interactive in front, batch in the background when the load is light. Embedded: a computer built into the product it controls.";
const type = (prompt: string, correct: string, apply: string, hint: string): Row => ({
  prompt,
  correct,
  wrong: TYPES.filter((t) => t !== correct),
  rule: OS_TYPES,
  apply,
  hint,
});
const describes: Row[] = [
  type("Jobs are entered whole and in sequence, and one job finishes before the next starts. Which type of operating system is this?", "Batch", "One job at a time, in sequence, is a batch system.", "Look at how the jobs enter and whether they overlap."),
  type("Several jobs are in progress at once and the response is faster than in a batch system. Which type is this?", "Interactive", "Several jobs in progress with faster response is an interactive system.", "Which type is faster to respond than batch?"),
  type("It runs interactive work in front and batch work in the background when the load is light. Which type is this?", "Hybrid", "Interactive in front plus batch behind is a hybrid system, the most common today.", "It combines two of the other types."),
  type("It is a computer built into the product it controls. Which type of operating system is this?", "Embedded", "A computer built into its product is an embedded system.", "Think of where the computer sits."),
];
const examples: Row[] = [
  type("Which type of operating system is a computer built into the product it controls, such as the engine, brakes and navigation of a car?", "Embedded", "A computer built into a car is embedded.", "Is the computer a separate machine or part of the product?"),
  type("Which type of operating system fits air-traffic control?", "Real-time", "Air-traffic control must meet a strict deadline every time: real-time.", "What happens if the answer comes late?"),
  type("Which type of operating system fits an early punched-card system?", "Batch", "Punched-card jobs were entered whole and run in sequence: batch.", "Cards were fed in as whole jobs, one after another."),
  type("Which type of operating system fits terminal users sharing one computer?", "Interactive", "Several users in progress at once with fast response: interactive.", "Several users each expect an answer quickly."),
];

const RT = "Real-time systems must meet a strict deadline every time. In a hard real-time system a missed deadline means total system failure; in a soft real-time system it only degrades performance.";
const rt = (prompt: string, correct: string, apply: string): Row => ({
  prompt,
  correct,
  wrong: ["Hard real-time", "Soft real-time", "Batch", "Interactive"].filter((t) => t !== correct),
  rule: RT,
  apply,
  hint: "Compare what a missed deadline costs: everything, or only some performance.",
});
const deadline: Row[] = [
  rt("A missed deadline causes total system failure. Which kind of system is this?", "Hard real-time", "Total failure on a missed deadline is hard real-time."),
  rt("A missed deadline only degrades performance. Which kind of system is this?", "Soft real-time", "Only degraded performance on a missed deadline is soft real-time."),
  {
    prompt: "What does a missed deadline cause in a hard real-time system?",
    correct: "Total system failure",
    wrong: ["Only degraded performance", "A slower response, nothing more", "Nothing"],
    rule: RT,
    apply: "In a hard real-time system a missed deadline means total system failure.",
    hint: "Hard means the deadline can never be missed.",
  },
];

export const interfacesAndTypesTopic: TopicInput = {
  id: "interfaces-and-types",
  title: "User interfaces and types of operating system",
  summary: "GUI against command line, and the batch, interactive, real-time, hybrid and embedded types.",
  concepts: [
    { id: "ui.compare", title: "GUI vs command line", summary: "A GUI is pointed at and easy; a command line is typed, chainable and exact." },
    { id: "ty.types", title: "Types of operating system", summary: "Batch, interactive, real-time (hard and soft), hybrid and embedded." },
  ],
  objectives: [
    { id: "ui.obj.input", conceptId: "ui.compare", text: "Say how a GUI and a command line take input." },
    { id: "ui.obj.strength", conceptId: "ui.compare", text: "Give the strengths and demands of each interface." },
    { id: "ty.obj.describe", conceptId: "ty.types", text: "Name the type of OS from its description." },
    { id: "ty.obj.example", conceptId: "ty.types", text: "Name the type of OS that fits an example." },
    { id: "ty.obj.deadline", conceptId: "ty.types", text: "Tell hard from soft real-time by what a missed deadline costs." },
  ],
  activities: [
    {
      id: "gui-vs-command-line",
      title: "GUI vs command line",
      summary: "How each takes input, and what each is good and demanding at.",
      authority: "DEMO",
      minutes: 4,
      questions: [mcq("ui.q.input", "How it takes input", "ui.compare", "ui.obj.input", input), mcq("ui.q.strength", "Strengths and demands", "ui.compare", "ui.obj.strength", strength, 1)],
    },
    {
      id: "os-types",
      title: "Types of operating system",
      summary: "Name the type from a description or an example, and tell hard from soft real-time.",
      authority: "DEMO",
      minutes: 8,
      questions: [
        mcq("ty.q.describe", "Name the type", "ty.types", "ty.obj.describe", describes),
        mcq("ty.q.example", "Which type fits", "ty.types", "ty.obj.example", examples, 2),
        mcq("ty.q.deadline", "Hard or soft", "ty.types", "ty.obj.deadline", deadline, 1),
      ],
    },
  ],
};
