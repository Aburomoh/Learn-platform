/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 8, file management (#571; content pack ch8 §1–§5, §7 and the #588 inventory
 * C8-1 … C8-5, C8-7): the File Manager's duties, the data hierarchy, file names, fixed and
 * variable-length records, the three record organizations (with the file-layout figure), and FAT
 * against NTFS. Multiple choice and two numeric counts; every fact is from
 * docs/content-packs/cpet181/ch8.md and no quiz key is used.
 */
import type { z } from "zod";
import type { TopicSchema } from "../../schema";
import { mcq, type Row } from "../chapter1/mcq";
import { sequentialRead, blockOf } from "./counting";

type TopicInput = z.input<typeof TopicSchema>;
type Figure = NonNullable<Row["figure"]>;

const row = (prompt: string, correct: string, wrong: string[], rule: string, apply: string, hint: string, figure?: Figure): Row => ({ prompt, correct, wrong, rule, apply, hint, ...(figure ? { figure } : {}) });

/* ---------- the File Manager, the hierarchy, names, records ---------- */

const DUTIES = "The File Manager creates, deletes, modifies and controls access to files. It knows where each file is, applies the storage policy (where and how), allocates a file to a cleared user, and deallocates it when it is returned.";
const duties = mcq("fm.q.duties", "File Manager duties", "fm.manager", "fm.obj.duties", [
  row("Which is a duty of the File Manager?", "Keeping track of where each file is stored", ["Giving the CPU to a ready process", "Placing a job in main memory"], DUTIES, "Knowing where each file is belongs to the File Manager.", "Which manager deals with files, not with the CPU or main memory?"),
  row("Which task belongs to the File Manager?", "Applying the storage policy: where and how files are stored", ["Moving a job from HOLD to READY", "Choosing a Round Robin quantum"], DUTIES, "The storage policy (where and how) is the File Manager's.", "The task is about files, not jobs."),
  row("A user who is cleared to use a file asks for it. What does the File Manager do?", "Allocates the file to the user", ["Gives the user the CPU", "Compacts the user's memory"], DUTIES, "A file is allocated to a user who is cleared.", "The thing being handed out is a file."),
  row("A user returns a file after use. What does the File Manager do?", "Deallocates the file", ["Allocates a new quantum", "Compacts main memory"], DUTIES, "A returned file is deallocated.", "The opposite of allocating."),
]);

const HIERARCHY = "A field is a named group of related bytes with a type and size. A record is a group of related fields. A file is a group of related records used by applications. A database is related files linked at several levels for flexible access.";
const hierarchy = mcq("fm.q.terms", "Level of the hierarchy", "fm.terms", "fm.obj.terms", [
  row("A named group of related bytes with a type and a size is a…", "Field", ["Record", "File", "Database"], HIERARCHY, "Named, typed bytes: a field.", "It is the smallest piece in the hierarchy."),
  row("A group of related fields is a…", "Record", ["Field", "File", "Database"], HIERARCHY, "Related fields make a record.", "Which level sits directly above fields?"),
  row("A group of related records used by an application is a…", "File", ["Field", "Record", "Database"], HIERARCHY, "Related records used by an application make a file.", "Which level sits directly above records?"),
  row("Related files linked at several levels for flexible access are a…", "Database", ["Field", "Record", "File"], HIERARCHY, "Files linked at several levels: a database.", "It is the top of the hierarchy."),
]);

const NAMES = "An absolute name is the full path. A relative name is the short name chosen at creation and seen in a listing. The extension identifies the type (EXE, TXT, DOC, MP4, PDF, PPT). A directory is a list of filenames with their attributes.";
const names = mcq("fm.q.names", "Names and directories", "fm.terms", "fm.obj.names", [
  row("The full path to a file is its…", "Absolute name", ["Relative name", "Extension"], NAMES, "The full path is the absolute name.", "One name spells out the whole path."),
  row("The short name chosen when a file is created and seen in a listing is its…", "Relative name", ["Absolute name", "Extension"], NAMES, "The short name seen in a listing is the relative name.", "It is not the whole path."),
  row("The suffix that tells the file's type, as in .PDF or .MP4, is its…", "Extension", ["Absolute name", "Relative name"], NAMES, "The suffix that identifies the type is the extension.", "It says what kind of file this is."),
  row("A list of filenames with their attributes is a…", "Directory", ["Record", "Database"], NAMES, "A list of filenames and attributes is a directory.", "It lists files; it does not hold their records."),
]);

const RECORDS = "Fixed-length records make direct access easiest; their size is critical, and fields may be cut off or padded. Variable-length records waste no space and cut nothing off, but direct access is difficult; they suit sequentially accessed files.";
const records = mcq("fm.q.records", "Fixed or variable length", "fm.records", "fm.obj.records", [
  row("Which kind of record makes direct access easiest?", "Fixed-length", ["Variable-length"], RECORDS, "Direct access is easiest with fixed-length records.", "Where a record starts is easy to compute when all are the same size."),
  row("A field is stored as “Harrisbur” and the last letter is lost. Which kind of record is this?", "Fixed-length", ["Variable-length"], RECORDS, "A fixed size can cut a field off.", "Which kind has a size set in advance?"),
  row("Which kind of record leaves no empty space and cuts nothing off?", "Variable-length", ["Fixed-length"], RECORDS, "Variable-length records waste no space and truncate nothing.", "Their size adapts to the data."),
  row("Which kind of record is typical of sequentially accessed files?", "Variable-length", ["Fixed-length"], RECORDS, "Variable-length records suit sequentially accessed files.", "The other kind is typical of data files with direct access."),
]);

/* ---------- physical record organization ---------- */

const ORG = "Sequential: records one after another, searched from the start; easiest to implement, slow to find one record. Direct: the relative address is computed from the key, on direct-access storage only; fast, but keys can give the same address (a collision). Indexed sequential: an ordered file split into equal blocks plus an index file; the best of both, with no collisions.";
const FIGURE_CAPTION = "One file's records, drawn as they are stored.";
const sequentialFigure: Figure = { type: "file-layout", layout: "sequential", records: ["12", "25", "31", "47", "58"], caption: FIGURE_CAPTION };
const directFigure: Figure = { type: "file-layout", layout: "direct", records: ["14", "27", "31", "56"], caption: FIGURE_CAPTION };
const indexedFigure: Figure = { type: "file-layout", layout: "indexed", records: ["10", "20", "30", "40", "50", "60"], blockSize: 3, caption: FIGURE_CAPTION };
const NAMES3 = ["Sequential", "Direct", "Indexed sequential"];
const other = (name: string) => NAMES3.filter((n) => n !== name);

const identify = mcq("ro.q.identify", "Which layout is drawn", "ro.organization", "ro.obj.identify", [
  row("The figure shows how one file's records are stored. Which organization is it?", "Direct", other("Direct"), ORG, "The address is computed from each key: a direct file.", "Look for a rule that turns a key into an address.", directFigure),
  row("The figure shows how one file's records are stored. Which organization is it?", "Indexed sequential", other("Indexed sequential"), ORG, "Ordered blocks with an index above them: an indexed sequential file.", "Is there anything above the records that points to them?", indexedFigure),
  row("The figure shows how one file's records are stored. Which organization is it?", "Sequential", other("Sequential"), ORG, "The records sit one after another with nothing else: a sequential file.", "Is there an address rule or an index?", sequentialFigure),
]);

const traits = mcq("ro.q.traits", "Which organization", "ro.organization", "ro.obj.traits", [
  row("Records are read one after another from the start. It is easiest to implement but slow to find one record. Which organization?", "Sequential", other("Sequential"), ORG, "Searching from the start is sequential.", "What do you do to find the last record?"),
  row("The record's relative address is computed from its key. It is fast, but two keys can give the same address. Which organization?", "Direct", other("Direct"), ORG, "An address computed from the key, with collisions, is direct.", "Which organization can have collisions?"),
  row("An ordered file is split into equal blocks and an index file points to them, with no collisions. Which organization?", "Indexed sequential", other("Indexed sequential"), ORG, "Blocks plus an index file: indexed sequential.", "It takes something from each of the other two."),
  row("Which organization is available on direct-access storage (DASD) only?", "Direct", other("Direct"), ORG, "Direct organization needs direct-access storage.", "Computing an address needs the device to jump to it."),
]);

const FACTORS = "The organization is chosen by volatility (how often the data changes), activity (how often records are accessed), the size of the file, and the response time needed.";
const FACTOR_NAMES = ["Volatility", "Activity", "File size", "Response time"];
const otherFactors = (name: string) => FACTOR_NAMES.filter((n) => n !== name).slice(0, 3);
const factors = mcq("ro.q.factors", "Factors for choosing", "ro.organization", "ro.obj.factors", [
  row("The records of a file change often. Which factor in choosing an organization is this?", "Volatility", otherFactors("Volatility"), FACTORS, "How often the data changes is its volatility.", "The factor is about change."),
  row("How often the records of a file are accessed is which factor?", "Activity", otherFactors("Activity"), FACTORS, "How often records are accessed is activity.", "The factor is about use, not size."),
  row("How large the file is counts as which factor?", "File size", otherFactors("File size"), FACTORS, "The size of the file is a factor on its own.", "Say it back: the factor's name is the quantity."),
  row("How quickly a record must be delivered after a request is which factor?", "Response time", otherFactors("Response time"), FACTORS, "The time allowed to deliver a record is the response time.", "The factor is about waiting."),
]);

/* ---------- FAT and NTFS ---------- */

const FATNTFS = "FAT (File Allocation Table, a table of contents) was used by MS-DOS and Windows 95/98; it suits drives and partitions under about 200 MB, has little overhead, supports partitions up to 4 GB and slows on large ones. NTFS (New Technology File System) is for later Windows and larger volumes (not below about 400 MB); it loses no performance, needs no repair utilities, keeps copies of critical files and offers transparent compression and encryption.";
const FS = ["FAT", "NTFS"];
const otherFs = (name: string) => FS.filter((n) => n !== name);
const fsFacts = mcq("nt.q.facts", "FAT or NTFS", "nt.systems", "nt.obj.facts", [
  row("Which file system is a “table of contents” of the drive, used by MS-DOS and Windows 95/98?", "FAT", otherFs("FAT"), FATNTFS, "The File Allocation Table is FAT.", "Which name says table?"),
  row("Which file system is designed so that repair utilities are not needed and keeps copies of critical files?", "NTFS", otherFs("NTFS"), FATNTFS, "Self-recovering, with copies of critical files: NTFS.", "It belongs to the later Windows versions."),
  row("Which file system has transparent compression and encryption built in?", "NTFS", otherFs("NTFS"), FATNTFS, "Built-in compression and encryption are NTFS.", "It is the newer of the two."),
  row("On which file system does a large partition slow down?", "FAT", otherFs("FAT"), FATNTFS, "FAT slows on large partitions; NTFS does not lose performance.", "One of them is designed for larger volumes."),
]);

const choose = mcq("nt.q.choose", "Which fits", "nt.systems", "nt.obj.choose", [
  row("A small 120 MB partition on an older machine, where low overhead matters. Which file system fits best?", "FAT", otherFs("FAT"), FATNTFS, "Under about 200 MB with little overhead: FAT. NTFS is not meant below about 400 MB.", "NTFS has overhead that a very small volume cannot spare."),
  row("A 6 GB partition has to be formatted. Which file system can be used?", "NTFS", otherFs("NTFS"), FATNTFS, "FAT partitions go up to 4 GB, so 6 GB needs NTFS.", "Compare 6 GB with FAT's partition limit."),
  row("A floppy disk has to be formatted. Which file system can be used?", "FAT", otherFs("FAT"), FATNTFS, "NTFS cannot format a floppy; FAT can.", "One of the two cannot format a floppy."),
  row("A large volume where performance must not fall as it fills. Which file system fits?", "NTFS", otherFs("NTFS"), FATNTFS, "NTFS has no performance loss; FAT slows on large partitions.", "Which one slows down when large?"),
]);

/* ---------- topics ---------- */

export const fileBasicsTopic: TopicInput = {
  id: "file-basics",
  title: "The File Manager, files and records",
  summary: "What the File Manager does, the data hierarchy from field to database, file names, and fixed against variable-length records.",
  concepts: [
    { id: "fm.manager", title: "The File Manager", summary: "Creates, deletes, modifies and controls access; keeps track of files, applies the storage policy, allocates and deallocates." },
    { id: "fm.terms", title: "Field, record, file, database, names", summary: "The data hierarchy, absolute and relative names, extensions and directories." },
    { id: "fm.records", title: "Fixed and variable-length records", summary: "Direct access and wasted space against truncation." },
  ],
  objectives: [
    { id: "fm.obj.duties", conceptId: "fm.manager", text: "Say which tasks belong to the File Manager." },
    { id: "fm.obj.terms", conceptId: "fm.terms", text: "Name the level of the data hierarchy from its description." },
    { id: "fm.obj.names", conceptId: "fm.terms", text: "Tell an absolute name, a relative name, an extension and a directory apart." },
    { id: "fm.obj.records", conceptId: "fm.records", text: "Say which kind of record gives easy direct access and which wastes no space." },
  ],
  activities: [
    { id: "file-manager", title: "The File Manager", summary: "What the File Manager does.", authority: "DEMO", minutes: 5, questions: [duties] },
    { id: "hierarchy", title: "Fields, records, files and names", summary: "The hierarchy, names and directories.", authority: "DEMO", minutes: 8, questions: [hierarchy, names] },
    { id: "record-types", title: "Fixed and variable-length records", summary: "Which kind suits which use.", authority: "DEMO", minutes: 5, questions: [records] },
  ],
};

export const recordOrganizationTopic: TopicInput = {
  id: "record-organization",
  title: "Record organization",
  summary: "Sequential, direct and indexed sequential files: how each is laid out, what it costs, and how a record is found.",
  concepts: [
    { id: "ro.organization", title: "Sequential, direct and indexed sequential", summary: "Search from the start; an address computed from the key; ordered blocks plus an index." },
    { id: "ro.search", title: "Finding a record", summary: "Records read from the start in a sequential file; the block the index points to in an indexed sequential file." },
  ],
  objectives: [
    { id: "ro.obj.identify", conceptId: "ro.organization", text: "Say which organization a file-layout figure shows." },
    { id: "ro.obj.traits", conceptId: "ro.organization", text: "Say which organization has a given advantage or disadvantage." },
    { id: "ro.obj.factors", conceptId: "ro.organization", text: "Name the factor (volatility, activity, size, response time) a situation describes." },
    { id: "ro.obj.read", conceptId: "ro.search", text: "Count the records read to find one in a sequential file." },
    { id: "ro.obj.block", conceptId: "ro.search", text: "Find the block an index sends you to." },
  ],
  activities: [
    { id: "organizations", title: "The three organizations", summary: "Recognise each layout and what it costs.", authority: "DEMO", minutes: 10, questions: [identify, traits] },
    { id: "choosing", title: "Choosing an organization", summary: "The four factors.", authority: "DEMO", minutes: 4, questions: [factors] },
    { id: "searching", title: "Finding a record", summary: "Count the records read; follow the index to a block.", authority: "DEMO", minutes: 8, questions: [sequentialRead, blockOf] },
  ],
};

export const fileSystemsTopic: TopicInput = {
  id: "fat-ntfs",
  title: "FAT and NTFS",
  summary: "Two common file systems: what each is for, where each fits and what each can and cannot do.",
  concepts: [{ id: "nt.systems", title: "FAT against NTFS", summary: "A small, low-overhead table against a larger, self-recovering system with compression and encryption." }],
  objectives: [
    { id: "nt.obj.facts", conceptId: "nt.systems", text: "Say which file system a described feature belongs to." },
    { id: "nt.obj.choose", conceptId: "nt.systems", text: "Choose FAT or NTFS for a described volume." },
  ],
  activities: [
    { id: "facts", title: "FAT or NTFS", summary: "Which feature belongs to which system.", authority: "DEMO", minutes: 6, questions: [fsFacts] },
    { id: "choose", title: "Which fits", summary: "Choose the file system for a volume.", authority: "DEMO", minutes: 6, questions: [choose] },
  ],
};
