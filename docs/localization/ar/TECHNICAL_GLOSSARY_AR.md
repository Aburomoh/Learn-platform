# CET Learn — Arabic technical glossary (translation draft)

Status: **complete working classification for owner/reviewer sign-off**. English remains the primary exam-facing term. Arabic is explanatory and secondary; it may be omitted when repetition would make a sentence unnecessarily long.

## Global rules

- Keep English technical terminology visible. For bilingual terms, preferred display is `English (العربية)`.
- Keep Western digits, equations, Boolean symbols, signal labels, variable names, register labels and data values unchanged.
- Terms in **English only** remain LTR-isolated inside Arabic prose and are not given an Arabic substitute.
- Acronyms remain in English even where an Arabic explanation is provided elsewhere.
- **No Arabic ending attached to an English term** (owner, 2026-10-13, #697). A dual «ين/ان», a plural, a tanween or a possessive suffix is never written straight after a Latin word: «Bitاً» renders broken (the tanween lands on the Latin letter and the alef joins the next word). Keep the English term bare and let the Arabic word beside it carry the agreement: «Bit واحدًا», «اثنين من الـ Inputs», «الـ Bits». Two English terms never meet across a full stop either: put an Arabic word between them (#701). `npm run l10n:drift` lists the strings that still break this rule until the list is empty.

## English + Arabic

| English primary | Arabic secondary |
|---|---|
| CPU | وحدة المعالجة المركزية |
| Memory | الذاكرة |
| Decimal | عشري |
| Binary | ثنائي |
| Carry | الحمل |
| Grouping (octal/hex) | التجميع في الثماني/السداسي عشري |
| Place value / weight | القيمة المكانية / الوزن |
| Complement | المتمم |
| Sum | المجموع |
| Remainder | الباقي |
| 1's complement | متمم الواحد |
| 2's complement | متمم الاثنين |
| Hexadecimal | سداسي عشري |
| Octal | ثماني |
| Base / radix | الأساس |
| Quotient | خارج القسمة |
| Binary point / fraction | الفاصلة الثنائية / الكسر |
| Input / output | دخل / خرج |
| Cell | خلية |
| Variable | متغير |
| Edge (rising / falling) | حافة صاعدة / هابطة |
| Gate | بوابة |
| Adjacent / neighbour | متجاور / جار |
| State | حالة |
| Product / product term | حاصل ضرب / حد حاصل ضرب |
| Present state / next state | الحالة الحالية / الحالة التالية |
| Equation | معادلة |
| Combinational / sequential circuit | دائرة توافقية / تتابعية |
| Expression | تعبير |
| Canonical form | الصيغة القياسية |
| Register | مسجل |
| Characteristic table / equation | جدول / معادلة الخصائص |
| Circuit | دائرة |
| Excitation table | جدول الإثارة |
| Simplify / simplification | تبسيط |
| State table | جدول الحالات |
| Clock | إشارة الساعة |
| Truth table | جدول الحقيقة |
| Boolean | بولياني |
| Select line | خط الاختيار |
| Design (sequential) | تصميم تتابعي |
| Job | مهمة |
| Process | عملية |
| Resource | مورد |
| Device | جهاز |
| Processor | معالج |
| Manager (Memory / Processor / Device / File / Network) | مدير الذاكرة / المعالج / الجهاز / الملف / الشبكة |
| Operating system | نظام التشغيل |
| Batch / interactive / real-time | دفعي / تفاعلي / وقت حقيقي |
| Program | برنامج |
| Hardware / software | عتاد / برمجيات |
| Main memory | الذاكرة الرئيسية |
| Secondary storage | التخزين الثانوي |
| Interrupt | مقاطعة |
| User interface / GUI / CLI | واجهة المستخدم |
| Context switch | تبديل السياق |
| Multiprogramming / multiprocessing | تعدد البرامج / تعدد المعالجة |
| Network | شبكة |
| Hole / free block | فجوة / كتلة حرة |
| Page | صفحة |
| Address | عنوان |
| Release / deallocate | تحرير / إلغاء تخصيص |
| Frame | إطار |
| Displacement / offset | إزاحة |
| Partition | قسم |
| Fragmentation (internal / external) | تجزؤ داخلي / خارجي |
| Fixed / dynamic partition | قسم ثابت / ديناميكي |
| Allocate / allocation | تخصيص |
| Segment / segmentation | مقطع / تقسيم إلى مقاطع |
| Best-fit | أفضل ملاءمة |
| First-fit | أول ملاءمة |
| Compaction / relocation | ضغط الذاكرة / إعادة التموضع |
| Paging | تقسيم إلى صفحات |
| Logical / physical address | عنوان منطقي / فعلي |
| Job table | جدول المهام |
| Virtual memory | ذاكرة افتراضية |
| Thrashing | إفراط في تبديل الصفحات |
| Arrival time | وقت الوصول |
| Turnaround time | زمن الإنجاز |
| Ready queue / READY | طابور الجاهزين / جاهز |
| Preemptive / non-preemptive | استباقي / غير استباقي |
| Quantum / time slice | الشريحة الزمنية |
| Round Robin | التناوب الدوري |
| Scheduler / scheduling | المجدول / الجدولة |
| Priority | الأولوية |
| HOLD / RUNNING / WAITING / FINISHED | معلّق / يعمل / ينتظر / منتهٍ |
| Response time | زمن الاستجابة |
| I/O-bound / CPU-bound | مقيد بالإدخال/الإخراج / مقيد بالمعالج |
| Waiting time | زمن الانتظار |
| Throughput | معدل الإنجاز |
| Dispatch | إسناد المعالج |
| Operation (expression tree) | عملية |
| Dedicated / shared / virtual device | جهاز مخصص / مشترك / افتراضي |
| Deadlock | توقف متبادل |
| Lock / locking | قفل / قفل المورد |
| Buffer | ذاكرة وسيطة |
| Starvation | حرمان |
| Reader / writer | قارئ / كاتب |
| Synchronization | مزامنة |
| Master/slave, loosely coupled, symmetric | رئيسي/تابع، مترابط بشكل فضفاض، متماثل |
| Race (condition) | حالة سباق |
| Circular wait | انتظار دائري |
| Producer / consumer | منتج / مستهلك |
| Hold and wait | الاحتفاظ والانتظار |
| No preemption | عدم الاستباق |
| Concurrent / parallel | متزامن / متوازٍ |
| Spooling | تجميع مهام الإدخال/الإخراج في طابور |
| Mutual exclusion | استبعاد متبادل |
| Aging | زيادة الأولوية تدريجياً |
| Critical region | منطقة حرجة |
| Field / record / database | حقل / سجل / قاعدة بيانات |
| File | ملف |
| Sequential / direct / indexed sequential | تتابعي / مباشر / تتابعي مفهرس |
| Disk | قرص |
| Tape | شريط مغناطيسي |
| Optical disc (CD / DVD / Blu-ray) | قرص ضوئي |
| Track / cylinder / surface | مسار / أسطوانة / سطح |
| Compression | ضغط |
| Front-end compression | ضغط البداية المشتركة |
| Head (read/write) | رأس القراءة/الكتابة |
| Blocking | تجميع السجلات في كتل |
| Absolute / relative name | اسم مطلق / نسبي |
| Directory | دليل |
| Extension | امتداد |

## English only

These remain English in learner-facing Arabic text. Ordinary Arabic grammar may surround them, but the term itself is not translated.

| Term |
|---|
| Latch |
| Flip-Flop |
| AND |
| OR |
| Bit |
| MSB |
| LSB |
| Byte |
| Minterm |
| NOT |
| Set / reset |
| Don't care |
| XOR |
| NAND |
| JK flip-flop |
| Decoder |
| SOP |
| Toggle |
| K-map |
| POS |
| T flip-flop |
| Multiplexer |
| Literal |
| NOR |
| XNOR |
| De Morgan |
| Adder |
| Encoder |
| SR flip-flop |
| Half adder |
| Full adder |
| D flip-flop |
| RAM |
| I/O |
| ROM |
| PCB |
| PMT |
| SMT |
| MMT |
| MMU |
| SRT |
| FCFS |
| SJN |
| SSD / HDD / flash |
| NTFS |
| FAT |
| IRG / IBG |
| DASD |

## Always preserve exactly

- Boolean/operator symbols: `+`, `·`, `′`, `⊕`, apostrophe notation.
- Signal labels and flip-flop input labels: `Q`, `Q′`, `Clk`, `En`, `Co`, `Ci`, `S`, `R`, `J`, `K`, `D`, `T`, `JA`, `KA`, etc.
- Variable names: `A`, `B`, `C`, `F`, `x`, `y`, `z`, etc.
- Process/resource/example identifiers: `P1`, `P2`, `R1`, `F1`, names and worked-example codes.
- Minterm/maxterm labels: `m0 … m15`, `M0 …`.
- File/unit/acronym tokens such as `MB`, `GB`, `EXE`, `TXT`, `DOC`, `MP4`, `PDF`, `PPT`, `EEPROM`, unless a separate explanatory phrase is needed.

## Notes for implementation

- Bilingual wording is a teaching aid, not a replacement for the English term.
- Repeating the Arabic gloss on every occurrence is allowed but not required when it makes a short hint unnecessarily long.
- Mixed-direction rendering must isolate English terms, equations and symbols as LTR runs inside RTL Arabic prose.
- Algorithm names (`FCFS`, `SJN`, `SRT`, `Round Robin`, `Priority`, `First-fit`, `Best-fit`) stay recognizable in English; where Arabic is shown, it is explanatory only.
