/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT — pending instructor approval.
 * CPET 181 Chapter 7, device management (#630; content pack ch7 §1–§7 and the #588 inventory
 * C7-1 … C7-12): the Device Manager and the three device types, storage media, magnetic tape (the
 * only counting content: n records → n − 1 gaps, blocks → blocks − 1 gaps, with the tape figure #625),
 * magnetic disks (with the tracks figure), optical discs and solid state. Multiple choice and gap
 * counts; every fact is from docs/content-packs/cpet181/ch7.md and no quiz key is used. Not asked,
 * because the pack does not teach it: seek scheduling, access-time calculations, RAID, the transfer-
 * rate formula's numbers, the DVD cost cell and the "15 times a CD" remark.
 */
import type { z } from "zod";
import type { TopicSchema } from "../../schema";
import { mcq, type Row } from "../chapter1/mcq";
import { count, type Count } from "../chapter8/counting";

type TopicInput = z.input<typeof TopicSchema>;
type Figure = NonNullable<Row["figure"]>;

const row = (prompt: string, correct: string, wrong: string[], rule: string, apply: string, hint: string, figure?: Figure): Row => ({ prompt, correct, wrong, rule, apply, hint, ...(figure ? { figure } : {}) });
const others = (all: string[], name: string) => all.filter((x) => x !== name);

/* ---------- the Device Manager, device types, storage media ---------- */

const DEALLOCATION = "The Device Manager deallocates a device at two levels: at the process level, after an I/O command, which is temporary; and at the job level, when the job is finished, which is permanent.";
const LEVELS = ["Process level", "Job level"];
const deallocation = mcq("dm.q.deallocation", "Process or job level", "dm.manager", "dm.obj.deallocation", [
  row("A device is released after an I/O command, and the process may ask for it again. Which level of deallocation is this?", "Process level", others(LEVELS, "Process level"), DEALLOCATION, "A temporary release after an I/O command is process-level deallocation.", "Is the release temporary or permanent?"),
  row("A device is released for good because the job that used it has finished. Which level of deallocation is this?", "Job level", others(LEVELS, "Job level"), DEALLOCATION, "A permanent release when the job ends is job-level deallocation.", "Is the release temporary or permanent?"),
  row("Which level of deallocation is permanent?", "Job level", others(LEVELS, "Job level"), DEALLOCATION, "Job-level deallocation is permanent.", "It happens when the job is finished."),
  row("Which level of deallocation happens after each I/O command?", "Process level", others(LEVELS, "Process level"), DEALLOCATION, "Process-level deallocation follows an I/O command and is temporary.", "It happens for each process's command, not for the whole job."),
]);

const TYPES = "A dedicated device is used by one job at a time for the whole job (tape drives, printers, plotters), which is wasteful when it sits idle. A shared device serves several processes with interleaved requests (disks), so the Device Manager must control conflicts by policy. A virtual device is a dedicated device made shareable, as a printer is through spooling.";
const TYPE_NAMES = ["Dedicated", "Shared", "Virtual"];
const types = mcq("dm.q.types", "Which kind of device", "dm.types", "dm.obj.types", [
  row("A tape drive is assigned to one job for the whole of its run. What kind of device is this?", "Dedicated", others(TYPE_NAMES, "Dedicated"), TYPES, "One job at a time for the whole job is a dedicated device.", "How many jobs use it at once?"),
  row("A disk serves several processes, with their requests interleaved. What kind of device is this?", "Shared", others(TYPE_NAMES, "Shared"), TYPES, "Interleaved requests from several processes make a shared device.", "How many processes use it at once?"),
  row("A printer is made shareable by spooling. What kind of device is this?", "Virtual", others(TYPE_NAMES, "Virtual"), TYPES, "A dedicated device made shareable by spooling is a virtual device.", "Spooling is what makes it shareable."),
  row("Which kind of device may sit idle part of the time, which is wasteful?", "Dedicated", others(TYPE_NAMES, "Dedicated"), TYPES, "A dedicated device is held by one job for its whole run, even when idle.", "Who holds it while the job is not using it?"),
]);

const MEDIA = "Magnetic tape is a sequential access medium: records are found by position. Direct access storage devices (DASD) are magnetic disks (floppy, zip, hard disk), optical discs (CD, DVD, Blu-ray) and flash memory: they reach a chosen place directly.";
const ACCESS = ["Sequential access", "Direct access (DASD)"];
const media = mcq("dm.q.media", "Sequential or direct", "dm.media", "dm.obj.media", [
  row("Magnetic tape is found by position, one record after another. What kind of medium is it?", "Sequential access", others(ACCESS, "Sequential access"), MEDIA, "Tape is a sequential access medium.", "Can it jump to a chosen place?"),
  row("A hard disk reads and writes a chosen place directly. What kind of medium is it?", "Direct access (DASD)", others(ACCESS, "Direct access (DASD)"), MEDIA, "A magnetic disk is a direct access storage device.", "Can it jump to a chosen place?"),
  row("A CD, DVD or Blu-ray disc is which kind of medium?", "Direct access (DASD)", others(ACCESS, "Direct access (DASD)"), MEDIA, "Optical discs are direct access storage devices.", "Think about how the laser reaches a place on the disc."),
  row("Flash memory is which kind of medium?", "Direct access (DASD)", others(ACCESS, "Direct access (DASD)"), MEDIA, "Flash memory is a direct access storage device.", "Has it any tape to wind?"),
]);

/* ---------- magnetic tape: gaps, blocking, tape against disk ---------- */

const GAPS = "On tape, a ½-inch gap lies between individually stored records (an inter-record gap, IRG) and between blocks of records (an inter-block gap, IBG). n records stored one by one have n − 1 IRGs; n blocks have n − 1 IBGs.";
const FIGURE = (records: number, block?: number): Figure => ({ type: "tape", records, ...(block ? { block } : {}), caption: block ? `Tape with ${records} records in blocks of ${block}.` : `Tape with ${records} records stored one by one.` });

/** The first is the slide's s.11: 10 records stored one by one have 9 gaps. */
export const IRG_RECORDS = [10, 7, 12, 5];
const irg = count(
  "tp.q.irg",
  "Counting IRGs",
  "tp.gaps",
  "tp.obj.irg",
  IRG_RECORDS.map((n): Count => ({
    prompt: `${n} records are stored on a tape one by one, as in the figure, each pair separated by an inter-record gap (IRG). How many IRGs are there?`,
    answer: n - 1,
    rule: GAPS,
    apply: `${n} records have ${n - 1} gaps between them: one fewer than the number of records.`,
    hint: "A gap lies between two records. Count the places between neighbours, not the records.",
    figure: FIGURE(n),
    wrong: [{ id: "tp.gap-per-record", nudgeKey: "tp.gaps-one-fewer", value: n }],
  })),
);

/** (records, block size): whole blocks only, so each prompt says exactly what the figure draws. */
export const IBG_SETS: [number, number][] = [[12, 4], [10, 5], [12, 3], [9, 3]];
export const gapsOf = (records: number, block: number) => records / block - 1;
const ibg = count(
  "tp.q.ibg",
  "Counting IBGs",
  "tp.gaps",
  "tp.obj.ibg",
  IBG_SETS.map(([n, b]): Count => ({
    prompt: `${n} records are stored on a tape in blocks of ${b} records, as in the figure, with an inter-block gap (IBG) between neighbouring blocks. How many IBGs are there?`,
    answer: gapsOf(n, b),
    rule: GAPS,
    apply: `${n} records in blocks of ${b} make ${n / b} blocks, and ${n / b} blocks have ${n / b - 1} gaps between them.`,
    hint: "First work out how many blocks there are, then count the gaps between them.",
    figure: FIGURE(n, b),
    wrong: [{ id: "tp.blocks-not-gaps", nudgeKey: "tp.gaps-one-fewer", value: n / b }],
  })),
);

const GAP_NAMES = ["Inter-record gap (IRG)", "Inter-block gap (IBG)"];
const gapKinds = mcq("tp.q.gap-kinds", "IRG or IBG", "tp.gaps", "tp.obj.gap-kinds", [
  row("Which gap lies between individually stored records on a tape?", "Inter-record gap (IRG)", others(GAP_NAMES, "Inter-record gap (IRG)"), GAPS, "The gap between single records is the IRG.", "Look at the first letters of the name."),
  row("Which gap lies between blocks of records on a tape?", "Inter-block gap (IBG)", others(GAP_NAMES, "Inter-block gap (IBG)"), GAPS, "The gap between blocks of records is the IBG.", "Look at the first letters of the name."),
  row("Records are grouped into blocks of ten, with a ½-inch gap between blocks. Which gap is this?", "Inter-block gap (IBG)", others(GAP_NAMES, "Inter-block gap (IBG)"), GAPS, "A gap between blocks is an IBG.", "What does the gap separate: single records or groups?"),
]);

const BLOCKING = "Blocking records on tape needs fewer I/O operations and wastes less tape. Its costs are the overhead of blocking and deblocking, and wasted buffer when only one record of a block is needed.";
const blocking = mcq("tp.q.blocking", "Blocking: gain or cost", "tp.blocking", "tp.obj.blocking", [
  row("Which is an advantage of blocking records on tape?", "Fewer I/O operations", ["Less overhead to code and decode", "No gaps at all"], BLOCKING, "Blocking means fewer I/O operations.", "One read brings in several records."),
  row("Which is an advantage of blocking records on tape?", "Less tape is wasted on gaps", ["The buffer is never wasted", "No blocking or deblocking is needed"], BLOCKING, "Fewer gaps are needed, so less tape is wasted.", "Count the gaps with and without blocks."),
  row("Which is a disadvantage of blocking records on tape?", "Overhead for blocking and deblocking", ["More I/O operations", "More tape is wasted"], BLOCKING, "Blocking and deblocking cost overhead.", "Something extra has to be done to each block."),
  row("Which is a disadvantage of blocking records on tape?", "The buffer is wasted when only one record is needed", ["Every record needs its own gap", "More I/O operations are needed"], BLOCKING, "A whole block is read into the buffer even if one record is wanted.", "Think of what is read when only one record is needed."),
]);

const TAPE_DISK = "Tape is cheap and compact and good for backup and archives, but its access time varies and it is poor for routine or interactive use. A magnetic disk gives direct access, is larger and faster than tape and reusable, but is dearer, needs a clean environment and is poor for sequential access.";
const TAPE_OR_DISK = ["Magnetic tape", "Magnetic disk"];
const tapeOrDisk = mcq("tp.q.tape-disk", "Tape or disk", "tp.tape-disk", "tp.obj.tape-disk", [
  row("Which medium is cheap and compact and good for backup and archives?", "Magnetic tape", others(TAPE_OR_DISK, "Magnetic tape"), TAPE_DISK, "Tape is cheap, compact and good for backup.", "Which one is the sequential one?"),
  row("Which medium gives direct access and is faster than the other?", "Magnetic disk", others(TAPE_OR_DISK, "Magnetic disk"), TAPE_DISK, "A disk gives direct access and is faster than tape.", "Which one can jump to a chosen place?"),
  row("Which medium needs a clean environment and is dearer?", "Magnetic disk", others(TAPE_OR_DISK, "Magnetic disk"), TAPE_DISK, "A disk is dearer than tape and needs a clean environment.", "The cheaper one is the other."),
  row("Which medium has a variable access time and is poor for interactive use?", "Magnetic tape", others(TAPE_OR_DISK, "Magnetic tape"), TAPE_DISK, "Tape has variable access time, poor for routine or interactive use.", "Which one must be read in order?"),
]);

/* ---------- magnetic disks ---------- */

const HEADS = "A fixed-head disk has one head per track, so it is faster, but costly with less capacity, and is used in spacecraft and aircraft. A movable-head disk has its heads moving together on one access arm, as in PC drives.";
const HEAD_NAMES = ["Fixed-head disk", "Movable-head disk"];
const heads = mcq("dk.q.heads", "Fixed or movable head", "dk.disks", "dk.obj.heads", [
  row("Each track has its own read/write head, so no head has to move. Which kind of disk?", "Fixed-head disk", others(HEAD_NAMES, "Fixed-head disk"), HEADS, "One head per track is a fixed-head disk.", "Does any head have to move?"),
  row("The heads move together on one access arm over the surfaces, as in a PC. Which kind of disk?", "Movable-head disk", others(HEAD_NAMES, "Movable-head disk"), HEADS, "Heads moving together on one arm: movable-head.", "Is there a head for every track?"),
  row("Which kind of disk is faster but costly, with less capacity?", "Fixed-head disk", others(HEAD_NAMES, "Fixed-head disk"), HEADS, "The fixed-head disk is faster but costlier, with less capacity.", "More heads cost more."),
  row("Which kind of disk is found in PC drives?", "Movable-head disk", others(HEAD_NAMES, "Movable-head disk"), HEADS, "PC drives have movable heads on one arm.", "The other kind is used in spacecraft and aircraft."),
]);

const TRACKS = "A magnetic disk has concentric tracks on its coated platter. An optical disc has one long spiral track read by a laser.";
const DISK_NAMES = ["Magnetic disk", "Optical disc"];
const tracks = mcq("dk.q.tracks", "Which disk", "dk.disks", "dk.obj.tracks", [
  row("The figure shows the tracks of a disk platter. Which kind of disk has tracks laid out like this?", "Magnetic disk", others(DISK_NAMES, "Magnetic disk"), TRACKS, "Concentric tracks belong to a magnetic disk.", "Are the tracks separate rings or one winding line?", { type: "tracks", tracks: "concentric", caption: "A disk platter and its tracks." }),
  row("The figure shows the tracks of a disk platter. Which kind of disk has tracks laid out like this?", "Optical disc", others(DISK_NAMES, "Optical disc"), TRACKS, "One long spiral track, read by a laser, belongs to an optical disc.", "Are the tracks separate rings or one winding line?", { type: "tracks", tracks: "spiral", caption: "A disk platter and its tracks." }),
  row("Which kind of disk has one long spiral track read by a laser?", "Optical disc", others(DISK_NAMES, "Optical disc"), TRACKS, "An optical disc has a single spiral track.", "Which one is read by a laser?"),
]);

const ADDRESS = "A record on a hard disk is addressed by its cylinder number, its surface number and its record number.";
const address = mcq("dk.q.address", "Parts of an address", "dk.disks", "dk.obj.address", [
  row("Which is part of the address of a record on a hard disk?", "Cylinder number", ["Frame number", "Page number", "Segment number"], ADDRESS, "The address is cylinder, surface and record number.", "Which of these are disk words rather than memory words?"),
  row("Which is part of the address of a record on a hard disk?", "Surface number", ["Frame number", "Quantum number", "Process number"], ADDRESS, "The address is cylinder, surface and record number.", "A hard disk has several platters, each with two surfaces."),
  row("Which is part of the address of a record on a hard disk?", "Record number", ["Page number", "Block number of memory", "Job number"], ADDRESS, "The address is cylinder, surface and record number.", "The last part names the record itself."),
]);

const DISK_PROS = "A disk has direct access, is large, faster than tape, less prone to corruption and reusable. Against that it is dearer than tape, needs a clean environment, is less portable and is poor for sequential access.";
const diskProsCons = mcq("dk.q.disk-pros-cons", "Disk: gain or cost", "dk.disks", "dk.obj.disk-pros-cons", [
  row("Which is an advantage of a magnetic disk?", "Direct access to a chosen record", ["It needs no clean environment", "It is cheaper than tape"], DISK_PROS, "Direct access is the disk's main advantage.", "Compare it with a medium that has to be read in order."),
  row("Which is a disadvantage of a magnetic disk?", "It is dearer than tape and needs a clean environment", ["It cannot be reused", "Its access time varies with position on the reel"], DISK_PROS, "A disk costs more than tape and needs a clean environment.", "What does it cost compared with tape?"),
  row("For which kind of use is a magnetic disk poor?", "Sequential access", ["Direct access", "Reusable storage"], DISK_PROS, "A disk is poor for sequential access.", "Which use does it do worse than tape?"),
]);

/* ---------- optical discs, solid state ---------- */

const DISCS = "A CD holds up to 700 MB, is optical and cheap and used for general data. A DVD holds 4.7–17 GB, is optical and used for multimedia. A Blu-ray disc holds up to 128 GB, uses a blue-violet laser with tighter tracks and is used for HD audio and video.";
const DISC_NAMES = ["CD", "DVD", "Blu-ray"];
const discs = mcq("op.q.discs", "CD, DVD or Blu-ray", "op.optical", "op.obj.discs", [
  row("Which optical disc holds up to about 700 MB and is used for general data?", "CD", others(DISC_NAMES, "CD"), DISCS, "Up to 700 MB is the CD.", "It is the smallest of the three."),
  row("Which optical disc holds between 4.7 GB and 17 GB and is used for multimedia?", "DVD", others(DISC_NAMES, "DVD"), DISCS, "4.7–17 GB for multimedia is the DVD.", "It sits between the other two in capacity."),
  row("Which optical disc uses a blue-violet laser with tighter tracks and holds up to 128 GB?", "Blu-ray", others(DISC_NAMES, "Blu-ray"), DISCS, "A blue-violet laser and the largest capacity: Blu-ray.", "The colour of the laser is in the name."),
  row("Which optical disc is used for HD audio and video?", "Blu-ray", others(DISC_NAMES, "Blu-ray"), DISCS, "HD audio and video is the Blu-ray's use.", "It is the newest and largest of the three."),
]);

const CDS = "CD-ROM is written by the manufacturer and can only be read. CD-R can be read and written once. CD-RW can be read, written and rewritten.";
const CD_NAMES = ["CD-ROM", "CD-R", "CD-RW"];
const cdTypes = mcq("op.q.cd-types", "CD-ROM, CD-R or CD-RW", "op.optical", "op.obj.cd-types", [
  row("A CD is written by its maker and can only be read. Which type is it?", "CD-ROM", others(CD_NAMES, "CD-ROM"), CDS, "Read only is the CD-ROM.", "The user cannot write to it at all."),
  row("A CD can be read and written once, but not rewritten. Which type is it?", "CD-R", others(CD_NAMES, "CD-R"), CDS, "Write once is the CD-R.", "R is for recordable: once."),
  row("A CD can be read, written and rewritten many times. Which type is it?", "CD-RW", others(CD_NAMES, "CD-RW"), CDS, "Rewritable is the CD-RW.", "RW means read and write again."),
]);

const SSD = "A solid state drive stores charge in floating-gate transistors and has no moving parts: it is silent, light and uses less power, but may crash without warning and its transfer rate degrades with time. Flash memory is portable, removable, non-volatile EEPROM, written by charge through the floating gate and erased by a strong field.";
const SS_NAMES = ["Solid state drive (SSD)", "Flash memory"];
const ssdFlash = mcq("ss.q.ssd-flash", "SSD or flash", "ss.solid", "ss.obj.ssd-flash", [
  row("Which is portable, removable EEPROM erased by a strong electric field (a flash)?", "Flash memory", others(SS_NAMES, "Flash memory"), SSD, "Portable removable EEPROM erased by a strong field is flash memory.", "Which one is used as a memory stick?"),
  row("Which is an internal drive of floating-gate cells with no moving parts?", "Solid state drive (SSD)", others(SS_NAMES, "Solid state drive (SSD)"), SSD, "An internal drive of floating-gate cells is an SSD.", "Which one replaces a hard disk drive?"),
  row("Which can crash without warning and loses transfer rate over time?", "Solid state drive (SSD)", others(SS_NAMES, "Solid state drive (SSD)"), SSD, "Those are the SSD's drawbacks.", "It is the drive-sized one."),
]);

const HDD_SSD = "Compared with an HDD, an SSD has faster access, lower power, lighter weight, no noise and no moving parts. The HDD costs less per GB, reaches very high capacity and has a longer write/rewrite lifetime.";
const HDD_NAMES = ["HDD", "SSD"];
const hddSsd = mcq("ss.q.hdd-ssd", "HDD or SSD", "ss.solid", "ss.obj.hdd-ssd", [
  row("Which has the faster access time, an HDD or an SSD?", "SSD", others(HDD_NAMES, "SSD"), HDD_SSD, "The SSD has faster access.", "Which one has no moving parts to wait for?"),
  row("Which has moving parts and makes noise, an HDD or an SSD?", "HDD", others(HDD_NAMES, "HDD"), HDD_SSD, "The HDD has moving parts and noise.", "Platters spin in one of them."),
  row("Which costs less per GB and reaches very high capacity, an HDD or an SSD?", "HDD", others(HDD_NAMES, "HDD"), HDD_SSD, "The HDD is cheaper per GB and larger.", "The faster one is the dearer one."),
  row("Which has the longer write and rewrite lifetime, an HDD or an SSD?", "HDD", others(HDD_NAMES, "HDD"), HDD_SSD, "The HDD lasts longer under rewriting.", "Charge stored in cells wears them out."),
]);

/* ---------- topics ---------- */

export const deviceManagerTopic: TopicInput = {
  id: "device-manager",
  title: "The Device Manager and devices",
  summary: "How a device is released, the three kinds of device, and sequential against direct access media.",
  concepts: [
    { id: "dm.manager", title: "Deallocation", summary: "Temporary at the process level after an I/O command; permanent at the job level when the job finishes." },
    { id: "dm.types", title: "Dedicated, shared and virtual", summary: "One job for its whole run; interleaved requests; a dedicated device made shareable by spooling." },
    { id: "dm.media", title: "Sequential and direct access media", summary: "Tape found by position; disks, optical discs and flash reached directly." },
  ],
  objectives: [
    { id: "dm.obj.deallocation", conceptId: "dm.manager", text: "Tell process-level from job-level deallocation." },
    { id: "dm.obj.types", conceptId: "dm.types", text: "Say whether a device is dedicated, shared or virtual." },
    { id: "dm.obj.media", conceptId: "dm.media", text: "Say whether a medium is sequential or direct access." },
  ],
  activities: [
    { id: "deallocation", title: "Releasing a device", summary: "Process level or job level.", authority: "DEMO", minutes: 5, questions: [deallocation] },
    { id: "device-types", title: "Dedicated, shared, virtual", summary: "Which kind of device.", authority: "DEMO", minutes: 6, questions: [types] },
    { id: "media", title: "Sequential or direct", summary: "How each medium is accessed.", authority: "DEMO", minutes: 5, questions: [media] },
  ],
};

export const magneticTapeTopic: TopicInput = {
  id: "magnetic-tape",
  title: "Magnetic tape",
  summary: "Counting the gaps on a tape, what blocking gains and costs, and how tape compares with disk.",
  concepts: [
    { id: "tp.gaps", title: "Gaps on tape", summary: "n records stored one by one have n − 1 inter-record gaps; n blocks have n − 1 inter-block gaps." },
    { id: "tp.blocking", title: "Blocking", summary: "Fewer I/O operations and less wasted tape, against overhead and wasted buffer." },
    { id: "tp.tape-disk", title: "Tape against disk", summary: "Cheap, compact, good for backup against direct access, faster, dearer." },
  ],
  objectives: [
    { id: "tp.obj.irg", conceptId: "tp.gaps", text: "Count the inter-record gaps of records stored one by one." },
    { id: "tp.obj.ibg", conceptId: "tp.gaps", text: "Count the inter-block gaps of records stored in blocks." },
    { id: "tp.obj.gap-kinds", conceptId: "tp.gaps", text: "Tell an IRG from an IBG." },
    { id: "tp.obj.blocking", conceptId: "tp.blocking", text: "Say whether a point about blocking is an advantage or a disadvantage." },
    { id: "tp.obj.tape-disk", conceptId: "tp.tape-disk", text: "Say whether a feature belongs to tape or to disk." },
  ],
  activities: [
    { id: "gap-kinds", title: "IRG or IBG", summary: "Which gap is which.", authority: "DEMO", minutes: 4, questions: [gapKinds] },
    { id: "count-gaps", title: "Counting gaps", summary: "Records one by one, then in blocks.", authority: "DEMO", minutes: 8, questions: [irg, ibg] },
    { id: "blocking", title: "Blocking", summary: "What it gains and what it costs.", authority: "DEMO", minutes: 5, questions: [blocking] },
    { id: "tape-vs-disk", title: "Tape or disk", summary: "Which medium has which feature.", authority: "DEMO", minutes: 5, questions: [tapeOrDisk] },
  ],
};

export const magneticDisksTopic: TopicInput = {
  id: "magnetic-disks",
  title: "Magnetic disks",
  summary: "Fixed against movable heads, concentric against spiral tracks, a record's address, and what a disk gains and costs.",
  concepts: [{ id: "dk.disks", title: "Disks", summary: "One head per track or heads on one arm; concentric tracks or one spiral; cylinder, surface and record number." }],
  objectives: [
    { id: "dk.obj.heads", conceptId: "dk.disks", text: "Tell a fixed-head disk from a movable-head disk." },
    { id: "dk.obj.tracks", conceptId: "dk.disks", text: "Tell concentric tracks (magnetic) from a spiral track (optical)." },
    { id: "dk.obj.address", conceptId: "dk.disks", text: "Name a part of a record's address on a hard disk." },
    { id: "dk.obj.disk-pros-cons", conceptId: "dk.disks", text: "Say what a disk gains and what it costs." },
  ],
  activities: [
    { id: "heads", title: "Fixed or movable heads", summary: "One head per track, or heads on one arm.", authority: "DEMO", minutes: 5, questions: [heads] },
    { id: "tracks", title: "Concentric or spiral", summary: "Which disk has which tracks.", authority: "DEMO", minutes: 4, questions: [tracks] },
    { id: "address", title: "A record's address", summary: "The parts of a hard disk address.", authority: "DEMO", minutes: 3, questions: [address] },
    { id: "disk-pros-cons", title: "Gain or cost", summary: "What a disk offers and costs.", authority: "DEMO", minutes: 4, questions: [diskProsCons] },
  ],
};

export const opticalSolidStateTopic: TopicInput = {
  id: "optical-solid-state",
  title: "Optical discs and solid state",
  summary: "CD, DVD and Blu-ray; CD-ROM, CD-R and CD-RW; SSD against flash memory; HDD against SSD.",
  concepts: [
    { id: "op.optical", title: "Optical discs", summary: "Capacity, laser and use of CD, DVD and Blu-ray; read only, write once and rewritable CDs." },
    { id: "ss.solid", title: "Solid state", summary: "SSD and flash memory, and how an SSD compares with an HDD." },
  ],
  objectives: [
    { id: "op.obj.discs", conceptId: "op.optical", text: "Say which optical disc a description fits." },
    { id: "op.obj.cd-types", conceptId: "op.optical", text: "Tell CD-ROM, CD-R and CD-RW apart." },
    { id: "ss.obj.ssd-flash", conceptId: "ss.solid", text: "Tell an SSD from flash memory." },
    { id: "ss.obj.hdd-ssd", conceptId: "ss.solid", text: "Say whether a feature belongs to an HDD or an SSD." },
  ],
  activities: [
    { id: "discs", title: "CD, DVD, Blu-ray", summary: "Capacity, laser and use.", authority: "DEMO", minutes: 6, questions: [discs] },
    { id: "cd-types", title: "CD-ROM, CD-R, CD-RW", summary: "Read, write once, rewrite.", authority: "DEMO", minutes: 4, questions: [cdTypes] },
    { id: "ssd-flash", title: "SSD or flash", summary: "Which is which.", authority: "DEMO", minutes: 4, questions: [ssdFlash] },
    { id: "hdd-ssd", title: "HDD or SSD", summary: "Which feature belongs to which.", authority: "DEMO", minutes: 5, questions: [hddSsd] },
  ],
};
