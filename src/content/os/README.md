# OS module (`src/content/os/`)

Course truth for CPET181 Ch4 (scheduling) and Ch2 (contiguous allocation), #539. Pure functions, no dependency.
Conventions are options; defaults come from the packs (`docs/content-packs/cpet181/ch4.md`, `ch2.md`).

| Need | Function |
|---|---|
| Schedule | `schedule(jobs, "fcfs" \| "sjn" \| "srt" \| "priority" \| "rr", { quantum, ... })` → `segments` (idle = `job: null`), per job `finish`/`turnaround`/`wait`, `avgTurnaround`, `avgWait` |
| Allocate | `allocate(blocks, jobs, "first" \| "best", "fixed" \| "dynamic")` → placements (allocation order), waiting, regions, summary (free/busy lists, used, internal fragmentation) |
| Step by step | `place`, `release` (dynamic merges free neighbours), `compact` (relocation register = new start − old start, × 1024 bytes) |

Waiting time is internal only (turnaround − CPU); content assesses finish, turnaround and the average turnaround.
Options marked `LOCAL SOURCE VERIFICATION NEEDED` in the code are tie rules the packs infer or never show.
