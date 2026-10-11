# Technical glossary — Arabic localization, Phase 1

Status: **for owner review. Nothing here is a translation proposal.** The only Arabic in this file is the four entries the owner supplied in #633. Every other term is listed with where it occurs and how often, so the owner can decide. Counts come from `source-texts.json` (the supportive text that Phase 2 would translate): "strings" is the number of distinct English strings that contain the term, "occurrences" counts every place the string is used (a hint repeated in many variants counts once per variant).

Matching is by word, case-insensitive, over the English text only, so a term used inside a question prompt (which stays English) is not counted. Plurals and common inflections are matched. A term that is a common English word (for example "set", "state", "group", "direct", "fixed") is listed because it is also a technical term in this course; the owner may want to decide on those in context, not by word.

## 1. APPROVED: ENGLISH + ARABIC

English primary, Arabic secondary in parentheses.

| English | Arabic (owner-supplied) | Strings | Occurrences | Where (course counts) | Main topics |
|---|---|---|---|---|---|
| CPU | وحدة المعالجة المركزية | 51 | 241 | ECET 111 0 · CPET 181 241 · shared tutor 0 | cpet181/fcfs-sjn (125), cpet181/scheduling-concepts (39), cpet181/srt (34) |
| Memory | الذاكرة | 82 | 125 | ECET 111 0 · CPET 181 125 · shared tutor 0 | cpet181/hardware-and-memory (36), cpet181/memory-schemes (24), cpet181/virtual-addresses (18) |
| Decimal | عشري | 27 | 155 | ECET 111 153 · CPET 181 0 · shared tutor 2 | ecet111/binary-arithmetic (98), ecet111/place-value (29), ecet111/digit-replacement (14) |
| Binary | ثنائي | 71 | 571 | ECET 111 569 · CPET 181 0 · shared tutor 2 | ecet111/binary-arithmetic (466), ecet111/full-adder (18), ecet111/half-adder (17) |

## 2. APPROVED: ENGLISH ONLY

Stay in English everywhere, including inside Arabic sentences (as LTR-isolated text, per REQUIREMENTS.md).

| Term | Strings | Occurrences | Where (course counts) | Main topics |
|---|---|---|---|---|
| Latch | 10 | 24 | ECET 111 24 · CPET 181 0 · shared tutor 0 | ecet111/latches (24) |
| Flip-Flop | 35 | 137 | ECET 111 136 · CPET 181 0 · shared tutor 1 | ecet111/timing (62), ecet111/analysis (52), ecet111/design (12) |
| AND | 90 | 198 | ECET 111 194 · CPET 181 0 · shared tutor 4 | ecet111/logic-gates (67), ecet111/circuits-expressions (36), ecet111/derived-gates (30) |
| OR | 89 | 226 | ECET 111 222 · CPET 181 0 · shared tutor 4 | ecet111/logic-gates (72), ecet111/circuits-expressions (66), ecet111/derived-gates (24) |

The owner also approved, as English only: **plus symbols, variable names, register names and signal labels**. They are not words, so they are counted as classes (a string can be in several):

| Class | Strings | Occurrences |
|---|---|---|
| Boolean operator symbols (+, ·, ′, ⊕, ') | 911 | 2415 |
| Signal labels (Q, Q′, Clk, En, Co, Ci, S, R, J, K, D, T, I0 … I7, D0 … D7, S0, S1) | 291 | 495 |
| Variable names (A, B, C, D, F, x, y, z …) | 821 | 1857 |
| Flip-flop input names (JA, KA, TB, DA …) | 37 | 42 |
| Process and resource names (P1, P2, R1, F1 …) | 12 | 12 |
| Minterm / maxterm labels (m0 … m15, M0 …) | 36 | 45 |

## 3. OWNER DECISION REQUIRED

Every other technical term found. **No Arabic is proposed.** Columns: strings that contain the term, total occurrences, split by course (the shared tutor catalog serves both courses), and the topics where it is most frequent. Terms the scan did not find in any supportive string are omitted (they appear only in questions or not at all).

### Number systems

| Term | Strings | Occurrences | Where | Main topics |
|---|---|---|---|---|
| Bit | 206 | 1459 | ECET 111 1453 · CPET 181 0 · shared tutor 6 | ecet111/binary-arithmetic (995), ecet111/number-systems (207), ecet111/digit-replacement (69) |
| Carry | 105 | 1406 | ECET 111 1401 · CPET 181 0 · shared tutor 5 | ecet111/binary-arithmetic (1370), ecet111/half-adder (15), ecet111/full-adder (8) |
| Grouping (octal/hex) | 168 | 1056 | ECET 111 1043 · CPET 181 5 · shared tutor 8 | ecet111/kmap-three (607), ecet111/number-systems (297), ecet111/digit-replacement (82) |
| Place value / weight | 151 | 448 | ECET 111 439 · CPET 181 4 · shared tutor 5 | ecet111/number-systems (164), ecet111/binary-arithmetic (151), ecet111/place-value (89) |
| Complement | 91 | 406 | ECET 111 406 · CPET 181 0 · shared tutor 0 | ecet111/binary-arithmetic (315), ecet111/kmap-three (30), ecet111/flip-flops (16) |
| Sum | 39 | 338 | ECET 111 231 · CPET 181 105 · shared tutor 2 | ecet111/binary-arithmetic (160), cpet181/fcfs-sjn (87), ecet111/kmap-three (30) |
| Remainder | 79 | 253 | ECET 111 221 · CPET 181 31 · shared tutor 1 | ecet111/number-systems (221), cpet181/paged-translation (24), cpet181/virtual-addresses (7) |
| 1's complement | 33 | 165 | ECET 111 165 · CPET 181 0 · shared tutor 0 | ecet111/binary-arithmetic (165) |
| 2's complement | 33 | 156 | ECET 111 156 · CPET 181 0 · shared tutor 0 | ecet111/binary-arithmetic (156) |
| Hexadecimal | 22 | 82 | ECET 111 82 · CPET 181 0 · shared tutor 0 | ecet111/number-systems (70), ecet111/digit-replacement (9), ecet111/place-value (3) |
| MSB | 30 | 79 | ECET 111 79 · CPET 181 0 · shared tutor 0 | ecet111/number-systems (44), ecet111/multiplexers (22), ecet111/decoders-encoders (13) |
| Octal | 14 | 51 | ECET 111 51 · CPET 181 0 · shared tutor 0 | ecet111/number-systems (32), ecet111/digit-replacement (16), ecet111/place-value (3) |
| Base / radix | 6 | 42 | ECET 111 42 · CPET 181 0 · shared tutor 0 | ecet111/place-value (30), ecet111/number-systems (12) |
| Quotient | 14 | 31 | ECET 111 0 · CPET 181 31 · shared tutor 0 | cpet181/paged-translation (24), cpet181/virtual-addresses (7) |
| LSB | 6 | 26 | ECET 111 26 · CPET 181 0 · shared tutor 0 | ecet111/number-systems (26) |
| Byte | 8 | 20 | ECET 111 0 · CPET 181 20 · shared tutor 0 | cpet181/paged-translation (8), cpet181/file-basics (6), cpet181/virtual-addresses (6) |
| Binary point / fraction | 4 | 12 | ECET 111 12 · CPET 181 0 · shared tutor 0 | ecet111/digit-replacement (12) |

### Digital

| Term | Strings | Occurrences | Where | Main topics |
|---|---|---|---|---|
| Input / output | 270 | 635 | ECET 111 605 · CPET 181 15 · shared tutor 15 | ecet111/logic-gates (132), ecet111/timing (111), ecet111/analysis (99) |
| Cell | 69 | 545 | ECET 111 533 · CPET 181 7 · shared tutor 5 | ecet111/kmap-three (387), ecet111/binary-arithmetic (72), ecet111/kmap-anatomy (19) |
| Variable | 74 | 370 | ECET 111 349 · CPET 181 20 · shared tutor 1 | ecet111/kmap-three (195), ecet111/multiplexers (31), ecet111/circuits-expressions (30) |
| Edge (rising / falling) | 43 | 347 | ECET 111 345 · CPET 181 0 · shared tutor 2 | ecet111/timing (187), ecet111/kmap-three (120), ecet111/three-jk (22) |
| Gate | 114 | 226 | ECET 111 217 · CPET 181 5 · shared tutor 4 | ecet111/logic-gates (73), ecet111/circuits-expressions (59), ecet111/analysis (35) |
| Minterm | 49 | 164 | ECET 111 163 · CPET 181 0 · shared tutor 1 | ecet111/kmap-three (79), ecet111/minterms (39), ecet111/decoders-encoders (21) |
| Adjacent / neighbour | 10 | 162 | ECET 111 99 · CPET 181 63 · shared tutor 0 | ecet111/kmap-three (60), cpet181/dynamic-partitions (51), ecet111/kmap-anatomy (36) |
| State | 60 | 125 | ECET 111 92 · CPET 181 26 · shared tutor 7 | ecet111/analysis (46), ecet111/design (29), cpet181/scheduling-concepts (21) |
| NOT | 38 | 119 | ECET 111 113 · CPET 181 0 · shared tutor 6 | ecet111/circuits-expressions (82), ecet111/logic-gates (22), ecet111/simplification (9) |
| Product / product term | 47 | 112 | ECET 111 100 · CPET 181 11 · shared tutor 1 | ecet111/sop-and-pos (57), ecet111/kmap-expression (20), cpet181/interfaces-and-types (11) |
| Present state / next state | 32 | 82 | ECET 111 76 · CPET 181 0 · shared tutor 6 | ecet111/analysis (46), ecet111/design (23), ecet111/three-jk (7) |
| Equation | 20 | 60 | ECET 111 58 · CPET 181 0 · shared tutor 2 | ecet111/analysis (49), ecet111/flip-flops (8), ecet111/design (1) |
| Combinational / sequential circuit | 28 | 52 | ECET 111 0 · CPET 181 52 · shared tutor 0 | cpet181/record-organization (23), cpet181/concurrent-programming (13), cpet181/device-manager (6) |
| Set / reset | 32 | 52 | ECET 111 47 · CPET 181 4 · shared tutor 1 | ecet111/latches (24), ecet111/timing (12), ecet111/flip-flops (7) |
| Expression | 18 | 47 | ECET 111 38 · CPET 181 8 · shared tutor 1 | ecet111/circuits-expressions (21), cpet181/concurrent-programming (8), ecet111/laws-and-rules (6) |
| Don't care | 3 | 38 | ECET 111 38 · CPET 181 0 · shared tutor 0 | ecet111/kmap-three (30), ecet111/design (8) |
| XOR | 19 | 32 | ECET 111 30 · CPET 181 0 · shared tutor 2 | ecet111/half-adder (16), ecet111/derived-gates (6), ecet111/full-adder (6) |
| Canonical form | 15 | 28 | ECET 111 28 · CPET 181 0 · shared tutor 0 | ecet111/minterms (24), ecet111/kmap-expression (4) |
| Register | 11 | 28 | ECET 111 0 · CPET 181 28 · shared tutor 0 | cpet181/relocatable-partitions (18), cpet181/scheduling-concepts (10) |
| NAND | 13 | 27 | ECET 111 26 · CPET 181 0 · shared tutor 1 | ecet111/latches (19), ecet111/logic-gates (4), ecet111/derived-gates (3) |
| JK flip-flop | 13 | 26 | ECET 111 26 · CPET 181 0 · shared tutor 0 | ecet111/analysis (16), ecet111/design (6), ecet111/flip-flops (4) |
| Characteristic table / equation | 10 | 24 | ECET 111 24 · CPET 181 0 · shared tutor 0 | ecet111/analysis (24) |
| Decoder | 8 | 18 | ECET 111 18 · CPET 181 0 · shared tutor 0 | ecet111/decoders-encoders (18) |
| Circuit | 6 | 18 | ECET 111 18 · CPET 181 0 · shared tutor 0 | ecet111/circuits-expressions (12), ecet111/three-jk (3), ecet111/logic-gates (2) |
| Excitation table | 5 | 18 | ECET 111 18 · CPET 181 0 · shared tutor 0 | ecet111/design (18) |
| SOP | 6 | 16 | ECET 111 16 · CPET 181 0 · shared tutor 0 | ecet111/sop-and-pos (16) |
| Toggle | 5 | 16 | ECET 111 14 · CPET 181 0 · shared tutor 2 | ecet111/timing (12), ecet111/flip-flops (1), ecet111/three-jk (1) |
| K-map | 2 | 13 | ECET 111 13 · CPET 181 0 · shared tutor 0 | ecet111/design (13) |
| Simplify / simplification | 3 | 12 | ECET 111 12 · CPET 181 0 · shared tutor 0 | ecet111/analysis (6), ecet111/simplification (3), ecet111/sop-and-pos (3) |
| POS | 7 | 11 | ECET 111 11 · CPET 181 0 · shared tutor 0 | ecet111/sop-and-pos (11) |
| T flip-flop | 3 | 10 | ECET 111 10 · CPET 181 0 · shared tutor 0 | ecet111/analysis (10) |
| Multiplexer | 5 | 9 | ECET 111 9 · CPET 181 0 · shared tutor 0 | ecet111/multiplexers (9) |
| Literal | 3 | 8 | ECET 111 8 · CPET 181 0 · shared tutor 0 | ecet111/kmap-anatomy (8) |
| NOR | 5 | 7 | ECET 111 6 · CPET 181 0 · shared tutor 1 | ecet111/derived-gates (3), ecet111/logic-gates (3) |
| State table | 3 | 7 | ECET 111 6 · CPET 181 0 · shared tutor 1 | ecet111/analysis (3), ecet111/three-jk (3) |
| XNOR | 2 | 6 | ECET 111 6 · CPET 181 0 · shared tutor 0 | ecet111/derived-gates (3), ecet111/full-adder (3) |
| De Morgan | 2 | 6 | ECET 111 6 · CPET 181 0 · shared tutor 0 | ecet111/de-morgan (6) |
| Adder | 2 | 6 | ECET 111 6 · CPET 181 0 · shared tutor 0 | ecet111/full-adder (3), ecet111/half-adder (3) |
| Encoder | 2 | 6 | ECET 111 6 · CPET 181 0 · shared tutor 0 | ecet111/decoders-encoders (6) |
| Clock | 2 | 5 | ECET 111 4 · CPET 181 0 · shared tutor 1 | ecet111/flip-flops (4) |
| SR flip-flop | 4 | 4 | ECET 111 4 · CPET 181 0 · shared tutor 0 | ecet111/flip-flops (4) |
| Truth table | 2 | 3 | ECET 111 3 · CPET 181 0 · shared tutor 0 | ecet111/half-adder (2), ecet111/logic-gates (1) |
| Boolean | 1 | 3 | ECET 111 3 · CPET 181 0 · shared tutor 0 | ecet111/laws-and-rules (3) |
| Half adder | 1 | 3 | ECET 111 3 · CPET 181 0 · shared tutor 0 | ecet111/half-adder (3) |
| Full adder | 1 | 3 | ECET 111 3 · CPET 181 0 · shared tutor 0 | ecet111/full-adder (3) |
| Select line | 2 | 3 | ECET 111 3 · CPET 181 0 · shared tutor 0 | ecet111/multiplexers (3) |
| D flip-flop | 3 | 3 | ECET 111 3 · CPET 181 0 · shared tutor 0 | ecet111/analysis (3) |
| Design (sequential) | 1 | 3 | ECET 111 3 · CPET 181 0 · shared tutor 0 | ecet111/design (3) |

### Operating systems

| Term | Strings | Occurrences | Where | Main topics |
|---|---|---|---|---|
| Job | 192 | 781 | ECET 111 0 · CPET 181 781 · shared tutor 0 | cpet181/fcfs-sjn (360), cpet181/scheduling-concepts (65), cpet181/fixed-partitions (54) |
| Process | 61 | 108 | ECET 111 0 · CPET 181 108 · shared tutor 0 | cpet181/scheduling-concepts (36), cpet181/deadlock-sketches (18), cpet181/device-manager (16) |
| Resource | 47 | 87 | ECET 111 0 · CPET 181 87 · shared tutor 0 | cpet181/os-and-managers (21), cpet181/deadlock-sketches (16), cpet181/four-conditions (14) |
| Device | 45 | 69 | ECET 111 0 · CPET 181 69 · shared tutor 0 | cpet181/device-manager (26), cpet181/hardware-and-memory (13), cpet181/interfaces-and-types (11) |
| Processor | 37 | 61 | ECET 111 0 · CPET 181 61 · shared tutor 0 | cpet181/multiprocessing (25), cpet181/concurrent-programming (16), cpet181/os-and-managers (11) |
| Manager (Memory / Processor / Device / File / Network) | 37 | 58 | ECET 111 0 · CPET 181 58 · shared tutor 0 | cpet181/os-and-managers (37), cpet181/file-basics (9), cpet181/device-manager (8) |
| Operating system | 28 | 50 | ECET 111 0 · CPET 181 50 · shared tutor 0 | cpet181/os-and-managers (19), cpet181/multiprocessing (11), cpet181/relocatable-partitions (9) |
| Batch / interactive / real-time | 30 | 42 | ECET 111 0 · CPET 181 42 · shared tutor 0 | cpet181/interfaces-and-types (34), cpet181/magnetic-tape (6), cpet181/scheduling-concepts (2) |
| Program | 21 | 39 | ECET 111 0 · CPET 181 39 · shared tutor 0 | cpet181/scheduling-concepts (10), cpet181/virtual-addresses (6), cpet181/memory-schemes (5) |
| RAM | 25 | 37 | ECET 111 0 · CPET 181 37 · shared tutor 0 | cpet181/hardware-and-memory (28), cpet181/virtual-addresses (9) |
| I/O | 21 | 33 | ECET 111 0 · CPET 181 33 · shared tutor 0 | cpet181/scheduling-concepts (18), cpet181/device-manager (8), cpet181/magnetic-tape (6) |
| ROM | 21 | 32 | ECET 111 0 · CPET 181 32 · shared tutor 0 | cpet181/hardware-and-memory (27), cpet181/optical-solid-state (5) |
| Hardware / software | 19 | 29 | ECET 111 0 · CPET 181 29 · shared tutor 0 | cpet181/os-and-managers (18), cpet181/paging-segmentation (5), cpet181/scheduling-concepts (5) |
| Main memory | 12 | 20 | ECET 111 0 · CPET 181 20 · shared tutor 0 | cpet181/os-and-managers (8), cpet181/virtual-addresses (6), cpet181/paging-segmentation (5) |
| Secondary storage | 13 | 19 | ECET 111 0 · CPET 181 19 · shared tutor 0 | cpet181/hardware-and-memory (19) |
| Interrupt | 7 | 15 | ECET 111 0 · CPET 181 15 · shared tutor 0 | cpet181/scheduling-concepts (8), cpet181/multiprocessing (7) |
| User interface / GUI / CLI | 7 | 12 | ECET 111 0 · CPET 181 12 · shared tutor 0 | cpet181/interfaces-and-types (12) |
| Context switch | 8 | 12 | ECET 111 0 · CPET 181 12 · shared tutor 0 | cpet181/scheduling-concepts (12) |
| Multiprogramming / multiprocessing | 6 | 10 | ECET 111 0 · CPET 181 10 · shared tutor 0 | cpet181/memory-schemes (5), cpet181/paging-segmentation (5) |
| Network | 5 | 10 | ECET 111 0 · CPET 181 10 · shared tutor 0 | cpet181/deadlock-basics (4), cpet181/memory-schemes (3), cpet181/os-and-managers (3) |
| PCB | 4 | 9 | ECET 111 0 · CPET 181 9 · shared tutor 0 | cpet181/scheduling-concepts (9) |

### Memory

| Term | Strings | Occurrences | Where | Main topics |
|---|---|---|---|---|
| Hole / free block | 25 | 151 | ECET 111 0 · CPET 181 151 · shared tutor 0 | cpet181/fixed-partitions (72), cpet181/dynamic-partitions (66), cpet181/paging-segmentation (9) |
| Page | 81 | 143 | ECET 111 0 · CPET 181 143 · shared tutor 0 | cpet181/paged-translation (100), cpet181/virtual-addresses (31), cpet181/paging-segmentation (12) |
| Address | 40 | 138 | ECET 111 0 · CPET 181 138 · shared tutor 0 | cpet181/paged-translation (40), cpet181/dynamic-partitions (39), cpet181/virtual-addresses (20) |
| Release / deallocate | 27 | 99 | ECET 111 0 · CPET 181 99 · shared tutor 0 | cpet181/dynamic-partitions (66), cpet181/device-manager (10), cpet181/four-conditions (8) |
| Frame | 39 | 76 | ECET 111 0 · CPET 181 76 · shared tutor 0 | cpet181/paged-translation (52), cpet181/virtual-addresses (18), cpet181/paging-segmentation (6) |
| Displacement / offset | 25 | 60 | ECET 111 0 · CPET 181 60 · shared tutor 0 | cpet181/paged-translation (36), cpet181/paging-segmentation (8), cpet181/segment-translation (8) |
| Partition | 22 | 58 | ECET 111 0 · CPET 181 58 · shared tutor 0 | cpet181/fixed-partitions (30), cpet181/fat-ntfs (15), cpet181/memory-schemes (7) |
| Fragmentation (internal / external) | 27 | 57 | ECET 111 0 · CPET 181 57 · shared tutor 0 | cpet181/paging-segmentation (23), cpet181/fixed-partitions (12), cpet181/memory-schemes (8) |
| Fixed / dynamic partition | 29 | 47 | ECET 111 0 · CPET 181 47 · shared tutor 0 | cpet181/paging-segmentation (10), cpet181/file-basics (8), cpet181/magnetic-disks (8) |
| Allocate / allocation | 26 | 47 | ECET 111 0 · CPET 181 47 · shared tutor 0 | cpet181/memory-schemes (11), cpet181/fat-ntfs (10), cpet181/deadlock-sketches (9) |
| Segment / segmentation | 27 | 45 | ECET 111 0 · CPET 181 45 · shared tutor 0 | cpet181/paging-segmentation (21), cpet181/segment-translation (16), cpet181/virtual-addresses (6) |
| Best-fit | 10 | 36 | ECET 111 0 · CPET 181 36 · shared tutor 0 | cpet181/fixed-partitions (21), cpet181/memory-schemes (8), cpet181/paging-segmentation (4) |
| First-fit | 9 | 32 | ECET 111 0 · CPET 181 32 · shared tutor 0 | cpet181/fixed-partitions (21), cpet181/memory-schemes (8), cpet181/dynamic-partitions (3) |
| Compaction / relocation | 9 | 28 | ECET 111 0 · CPET 181 28 · shared tutor 0 | cpet181/relocatable-partitions (18), cpet181/magnetic-tape (6), cpet181/paging-segmentation (4) |
| PMT | 14 | 26 | ECET 111 0 · CPET 181 26 · shared tutor 0 | cpet181/virtual-addresses (16), cpet181/paging-segmentation (6), cpet181/paged-translation (4) |
| Paging | 15 | 24 | ECET 111 0 · CPET 181 24 · shared tutor 0 | cpet181/paging-segmentation (21), cpet181/memory-schemes (2), cpet181/virtual-addresses (1) |
| Logical / physical address | 9 | 18 | ECET 111 0 · CPET 181 18 · shared tutor 0 | cpet181/virtual-addresses (10), cpet181/paged-translation (4), cpet181/segment-translation (4) |
| SMT | 7 | 16 | ECET 111 0 · CPET 181 16 · shared tutor 0 | cpet181/paging-segmentation (6), cpet181/virtual-addresses (6), cpet181/segment-translation (4) |
| MMT | 3 | 6 | ECET 111 0 · CPET 181 6 · shared tutor 0 | cpet181/virtual-addresses (6) |
| Job table | 3 | 6 | ECET 111 0 · CPET 181 6 · shared tutor 0 | cpet181/virtual-addresses (6) |
| MMU | 3 | 6 | ECET 111 0 · CPET 181 6 · shared tutor 0 | cpet181/virtual-addresses (6) |
| Virtual memory | 4 | 6 | ECET 111 0 · CPET 181 6 · shared tutor 0 | cpet181/paging-segmentation (5), cpet181/virtual-addresses (1) |
| Thrashing | 2 | 4 | ECET 111 0 · CPET 181 4 · shared tutor 0 | cpet181/paging-segmentation (4) |

### Processor management

| Term | Strings | Occurrences | Where | Main topics |
|---|---|---|---|---|
| Arrival time | 12 | 161 | ECET 111 0 · CPET 181 161 · shared tutor 0 | cpet181/fcfs-sjn (130), cpet181/srt (21), cpet181/scheduling-concepts (6) |
| Turnaround time | 11 | 155 | ECET 111 0 · CPET 181 155 · shared tutor 0 | cpet181/fcfs-sjn (145), cpet181/scheduling-concepts (10) |
| Ready queue / READY | 18 | 86 | ECET 111 0 · CPET 181 86 · shared tutor 0 | cpet181/fcfs-sjn (58), cpet181/scheduling-concepts (20), cpet181/concurrent-programming (8) |
| Preemptive / non-preemptive | 17 | 72 | ECET 111 0 · CPET 181 72 · shared tutor 0 | cpet181/round-robin (24), cpet181/fcfs-sjn (16), cpet181/four-conditions (13) |
| Quantum / time slice | 16 | 68 | ECET 111 0 · CPET 181 68 · shared tutor 0 | cpet181/round-robin (36), cpet181/srt (13), cpet181/scheduling-concepts (11) |
| Round Robin | 13 | 48 | ECET 111 0 · CPET 181 48 · shared tutor 0 | cpet181/round-robin (24), cpet181/compare-algorithms (12), cpet181/scheduling-concepts (12) |
| Scheduler / scheduling | 24 | 44 | ECET 111 0 · CPET 181 44 · shared tutor 0 | cpet181/scheduling-concepts (16), cpet181/multiprocessing (13), cpet181/concurrent-programming (8) |
| SRT | 11 | 41 | ECET 111 0 · CPET 181 41 · shared tutor 0 | cpet181/srt (21), cpet181/scheduling-concepts (12), cpet181/compare-algorithms (8) |
| FCFS | 11 | 40 | ECET 111 0 · CPET 181 40 · shared tutor 0 | cpet181/fcfs-sjn (18), cpet181/scheduling-concepts (13), cpet181/priority (9) |
| SJN | 8 | 31 | ECET 111 0 · CPET 181 31 · shared tutor 0 | cpet181/fcfs-sjn (21), cpet181/scheduling-concepts (10) |
| Priority | 11 | 31 | ECET 111 0 · CPET 181 31 · shared tutor 0 | cpet181/priority (12), cpet181/scheduling-concepts (9), cpet181/recovery-starvation (6) |
| HOLD / RUNNING / WAITING / FINISHED | 11 | 14 | ECET 111 0 · CPET 181 14 · shared tutor 0 | cpet181/scheduling-concepts (14) |
| Response time | 4 | 9 | ECET 111 0 · CPET 181 9 · shared tutor 0 | cpet181/record-organization (6), cpet181/scheduling-concepts (3) |
| I/O-bound / CPU-bound | 7 | 9 | ECET 111 0 · CPET 181 9 · shared tutor 0 | cpet181/scheduling-concepts (9) |
| Waiting time | 3 | 5 | ECET 111 0 · CPET 181 5 · shared tutor 0 | cpet181/scheduling-concepts (5) |
| Throughput | 3 | 5 | ECET 111 0 · CPET 181 5 · shared tutor 0 | cpet181/scheduling-concepts (5) |
| Dispatch | 2 | 2 | ECET 111 0 · CPET 181 2 · shared tutor 0 | cpet181/scheduling-concepts (2) |

### Concurrency

| Term | Strings | Occurrences | Where | Main topics |
|---|---|---|---|---|
| Operation (expression tree) | 41 | 99 | ECET 111 27 · CPET 181 72 · shared tutor 0 | cpet181/concurrent-programming (61), ecet111/circuits-expressions (27), cpet181/magnetic-tape (6) |
| Dedicated / shared / virtual device | 42 | 71 | ECET 111 9 · CPET 181 62 · shared tutor 0 | cpet181/compression (28), cpet181/device-manager (12), cpet181/four-conditions (10) |
| Deadlock | 28 | 48 | ECET 111 0 · CPET 181 48 · shared tutor 0 | cpet181/four-conditions (19), cpet181/deadlock-basics (14), cpet181/synchronization (6) |
| Lock / locking | 19 | 28 | ECET 111 2 · CPET 181 25 · shared tutor 1 | cpet181/deadlock-basics (18), cpet181/synchronization (7), ecet111/logic-gates (2) |
| Buffer | 16 | 25 | ECET 111 0 · CPET 181 25 · shared tutor 0 | cpet181/synchronization (19), cpet181/magnetic-tape (6) |
| Starvation | 15 | 24 | ECET 111 0 · CPET 181 24 · shared tutor 0 | cpet181/recovery-starvation (10), cpet181/deadlock-basics (8), cpet181/synchronization (6) |
| Reader / writer | 17 | 24 | ECET 111 0 · CPET 181 24 · shared tutor 0 | cpet181/synchronization (20), cpet181/deadlock-basics (2), cpet181/hardware-and-memory (2) |
| Synchronization | 11 | 23 | ECET 111 0 · CPET 181 23 · shared tutor 0 | cpet181/multiprocessing (15), cpet181/synchronization (8) |
| Master/slave, loosely coupled, symmetric | 14 | 20 | ECET 111 0 · CPET 181 20 · shared tutor 0 | cpet181/multiprocessing (20) |
| Race (condition) | 10 | 19 | ECET 111 0 · CPET 181 19 · shared tutor 0 | cpet181/synchronization (10), cpet181/deadlock-basics (9) |
| Circular wait | 4 | 14 | ECET 111 0 · CPET 181 14 · shared tutor 0 | cpet181/four-conditions (10), cpet181/deadlock-sketches (4) |
| Producer / consumer | 8 | 13 | ECET 111 0 · CPET 181 13 · shared tutor 0 | cpet181/synchronization (13) |
| Hold and wait | 5 | 12 | ECET 111 0 · CPET 181 12 · shared tutor 0 | cpet181/four-conditions (12) |
| No preemption | 5 | 12 | ECET 111 0 · CPET 181 12 · shared tutor 0 | cpet181/four-conditions (12) |
| Concurrent / parallel | 7 | 12 | ECET 111 0 · CPET 181 12 · shared tutor 0 | cpet181/concurrent-programming (6), cpet181/multiprocessing (6) |
| Spooling | 5 | 11 | ECET 111 0 · CPET 181 11 · shared tutor 0 | cpet181/device-manager (7), cpet181/deadlock-basics (4) |
| Mutual exclusion | 3 | 10 | ECET 111 0 · CPET 181 10 · shared tutor 0 | cpet181/four-conditions (10) |
| Aging | 4 | 7 | ECET 111 0 · CPET 181 7 · shared tutor 0 | cpet181/recovery-starvation (7) |
| Critical region | 3 | 6 | ECET 111 0 · CPET 181 6 · shared tutor 0 | cpet181/synchronization (6) |

### Files and storage

| Term | Strings | Occurrences | Where | Main topics |
|---|---|---|---|---|
| Field / record / database | 103 | 171 | ECET 111 0 · CPET 181 171 · shared tutor 0 | cpet181/magnetic-tape (52), cpet181/record-organization (51), cpet181/file-basics (28) |
| File | 64 | 108 | ECET 111 0 · CPET 181 108 · shared tutor 0 | cpet181/file-basics (32), cpet181/record-organization (29), cpet181/synchronization (14) |
| Sequential / direct / indexed sequential | 50 | 77 | ECET 111 0 · CPET 181 77 · shared tutor 0 | cpet181/record-organization (29), cpet181/concurrent-programming (13), cpet181/device-manager (12) |
| Disk | 42 | 71 | ECET 111 0 · CPET 181 71 · shared tutor 0 | cpet181/magnetic-disks (29), cpet181/device-manager (10), cpet181/hardware-and-memory (9) |
| Tape | 24 | 51 | ECET 111 0 · CPET 181 51 · shared tutor 0 | cpet181/magnetic-tape (29), cpet181/device-manager (11), cpet181/magnetic-disks (7) |
| Optical disc (CD / DVD / Blu-ray) | 32 | 45 | ECET 111 4 · CPET 181 41 · shared tutor 0 | cpet181/optical-solid-state (21), cpet181/hardware-and-memory (7), cpet181/magnetic-disks (7) |
| Track / cylinder / surface | 25 | 39 | ECET 111 0 · CPET 181 39 · shared tutor 0 | cpet181/magnetic-disks (28), cpet181/optical-solid-state (4), cpet181/os-and-managers (3) |
| SSD / HDD / flash | 23 | 34 | ECET 111 0 · CPET 181 34 · shared tutor 0 | cpet181/optical-solid-state (21), cpet181/hardware-and-memory (7), cpet181/device-manager (6) |
| Compression | 14 | 30 | ECET 111 0 · CPET 181 30 · shared tutor 0 | cpet181/compression (20), cpet181/fat-ntfs (10) |
| NTFS | 16 | 23 | ECET 111 0 · CPET 181 23 · shared tutor 0 | cpet181/fat-ntfs (23) |
| FAT | 14 | 21 | ECET 111 0 · CPET 181 21 · shared tutor 0 | cpet181/fat-ntfs (21) |
| IRG / IBG | 7 | 17 | ECET 111 0 · CPET 181 17 · shared tutor 0 | cpet181/magnetic-tape (17) |
| Front-end compression | 4 | 15 | ECET 111 0 · CPET 181 15 · shared tutor 0 | cpet181/compression (15) |
| Head (read/write) | 12 | 15 | ECET 111 0 · CPET 181 15 · shared tutor 0 | cpet181/magnetic-disks (15) |
| Blocking | 8 | 14 | ECET 111 0 · CPET 181 14 · shared tutor 0 | cpet181/magnetic-tape (8), cpet181/recovery-starvation (6) |
| Absolute / relative name | 5 | 8 | ECET 111 0 · CPET 181 8 · shared tutor 0 | cpet181/file-basics (8) |
| DASD | 4 | 7 | ECET 111 0 · CPET 181 7 · shared tutor 0 | cpet181/device-manager (7) |
| Directory | 3 | 6 | ECET 111 0 · CPET 181 6 · shared tutor 0 | cpet181/file-basics (6) |
| Extension | 3 | 6 | ECET 111 0 · CPET 181 6 · shared tutor 0 | cpet181/file-basics (6) |

### Other acronyms and capitalised labels found (not in the lists above)

These upper-case tokens appear in supportive text and were not matched by the term lists. Most are signal or variable names (English only per section 2); the owner should confirm any that are terms.

| Token | Strings | Occurrences | Example id |
|---|---|---|---|
| GB | 13 | 29 | `cpet181.fat-ntfs.choose.nt.q.choose.v2.explanation[1].say` |
| MB | 9 | 26 | `cpet181.fat-ntfs.choose.nt.q.choose.v1.explanation[1].say` |
| JQ | 9 | 17 | `ecet111.analysis.analysis-exercises.an.q.ex-next-a.xjk.hints[1]` |
| IRGs | 1 | 11 | `cpet181.magnetic-tape.gap-kinds.tp.q.gap-kinds.v1.explanation[0].say` |
| IBGs | 1 | 11 | `cpet181.magnetic-tape.gap-kinds.tp.q.gap-kinds.v1.explanation[0].say` |
| MS | 1 | 8 | `cpet181.fat-ntfs.facts.nt.q.facts.v1.explanation[0].say` |
| DOS | 1 | 8 | `cpet181.fat-ntfs.facts.nt.q.facts.v1.explanation[0].say` |
| SD | 5 | 8 | `cpet181.hardware-and-memory.hardware-categories.hw.q.secondary.v1.explanation[0].say` |
| RW | 5 | 7 | `cpet181.optical-solid-state.cd-types.op.q.cd-types.v1.explanation[0].say` |
| ADAMS | 6 | 6 | `cpet181.compression.repeated-characters.cp.q.run-code.v1.explanation[1].say` |
| JONES | 6 | 6 | `cpet181.compression.repeated-characters.cp.q.run-code.v2.explanation[1].say` |
| PC | 3 | 6 | `cpet181.magnetic-disks.heads.dk.q.heads.v1.explanation[0].say` |
| HD | 3 | 6 | `cpet181.optical-solid-state.discs.op.q.discs.v1.explanation[0].say` |
| EEPROM | 3 | 5 | `cpet181.optical-solid-state.ssd-flash.ss.q.ssd-flash.v1.explanation[0].say` |
| EXE | 1 | 4 | `cpet181.file-basics.hierarchy.fm.q.names.v1.explanation[0].say` |
| TXT | 1 | 4 | `cpet181.file-basics.hierarchy.fm.q.names.v1.explanation[0].say` |
| DOC | 1 | 4 | `cpet181.file-basics.hierarchy.fm.q.names.v1.explanation[0].say` |
| MP4 | 1 | 4 | `cpet181.file-basics.hierarchy.fm.q.names.v1.explanation[0].say` |
| PDF | 1 | 4 | `cpet181.file-basics.hierarchy.fm.q.names.v1.explanation[0].say` |
| PPT | 1 | 4 | `cpet181.file-basics.hierarchy.fm.q.names.v1.explanation[0].say` |
| ABC | 4 | 4 | `ecet111.kmap-algebra.kmap-algebra.km.q.algebra.aex1.explanation[1].say` |
| AC | 4 | 4 | `ecet111.kmap-three.kmap-three.km.q.three.m3467.explanation[2].say` |
| XY | 4 | 4 | `ecet111.laws-and-rules.laws-and-rules.br.q.simplify.vsimp-2.explanation[0].say` |
| ADAMSb10 | 3 | 3 | `cpet181.compression.repeated-characters.cp.q.run-code.v1.explanation[1].say` |
| JONESb7 | 3 | 3 | `cpet181.compression.repeated-characters.cp.q.run-code.v2.explanation[1].say` |
| CPUs | 2 | 2 | `cpet181.multiprocessing.parallel.cf.q.parallel.v4.explanation[1].say` |
| TQ | 1 | 2 | `ecet111.analysis.analysis-state.an.q.next-a.ct.hints[2]` |
| ABx | 2 | 2 | `ecet111.analysis.analysis-state.an.q.next-b.cjk.explanation[2].say` |
| ABX | 2 | 2 | `ecet111.design.design-problem.dz.q.problem-maps.pda.explanation[2].say` |
| BCX | 2 | 2 | `ecet111.design.design-problem.dz.q.problem-maps.pdb.explanation[2].say` |
| BCi | 2 | 2 | `ecet111.full-adder.full-adder-kmap.fa.q.kmap.vco.explanation[3].say` |
| ABCi | 2 | 2 | `ecet111.full-adder.full-adder-kmap.fa.q.kmap.vs.explanation[2].say` |
| MN | 2 | 2 | `ecet111.laws-and-rules.laws-and-rules.br.q.rule-more.vmore-absorb.explanation[1].ask.afterWrong` |
| ACi | 1 | 1 | `ecet111.full-adder.full-adder-kmap.fa.q.kmap.vco.explanation[3].say` |
| BCD | 1 | 1 | `ecet111.kmap-algebra.kmap-algebra.km.q.algebra.a88.explanation[1].say` |
| QR | 1 | 1 | `ecet111.laws-and-rules.laws-and-rules.br.q.law.vlaw-a.explanation[1].say` |
| PQ | 1 | 1 | `ecet111.laws-and-rules.laws-and-rules.br.q.law.vlaw-a.explanation[1].say` |
| WX | 1 | 1 | `ecet111.laws-and-rules.laws-and-rules.br.q.law.vlaw-d.explanation[1].say` |
| WY | 1 | 1 | `ecet111.laws-and-rules.laws-and-rules.br.q.law.vlaw-d.explanation[1].say` |

## Notes for the owner

- Gate names other than AND and OR (NOT, XOR, NAND, NOR, XNOR) are in section 3 because the owner's approved list names AND and OR only. They are the same family; listing them in section 3 is not a suggestion either way.
- "Flip-Flop" is approved English only; its sub-types (SR, JK, D, T) and the words around them (set, reset, toggle, clock, edge) are in section 3 or covered by the symbol classes above.
- Several course words are also ordinary English ("process", "page", "frame", "job", "state", "table", "map"). The occurrences count every use in supportive text, so the owner can see where an ordinary-looking word is doing technical work.
- Units and file types (MB, GB, EXE, TXT, DOC, MP4, PDF, PPT) and example names in worked examples (ADAMS, JONES, Smith) are data values or units, listed above only so nothing found is hidden; the owner decides whether units belong in the glossary.
- The question text itself (prompts, answer options, equations, circuit and variable names) stays English in every phase, so terms that appear only there are not listed.
