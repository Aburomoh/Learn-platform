# Product Vision

**What it is.** An interactive digital classroom/workbench for CET courses: structured practice,
interactive diagrams, deterministic tutoring, adaptive scaffolding and an instructor-like
digital presence. First form: a *course companion*, not a replacement for teaching. Architected
so it can later become an independent learning environment without redesign.

**Who it is for.** Initially Dr. Mohannad's CET students (Kuwait/Gulf higher education).
Usage is optional and has no relationship with official grades.

**Hierarchy of experience.**
1. Interactive classroom/workbench (the Learning Stage is the centrepiece, not a chatbot).
2. Khan-Academy-like organisation (course → module → topic → activity).
3. Light game influence only. No XP/coins/confetti/streak obsession/cartoon UI.

**Non-negotiables.**
- Guest access works meaningfully; accounts are optional and later.
- Course truth (answers, equations, concepts) is deterministic and instructor-approved.
- No commercial LLM is essential to v1 (see `TUTOR_ENGINE.md`).
- Low operating cost: static/CDN, client-side logic, minimal server work (`COST_RULES.md`).
- Learner profiles are course-offering scoped; no permanent ability labels (`LEARNER_MODEL.md`).

**Roadmap shape.**
M0 Organisation → M1 one convincing vertical slice (guest, one demo course, two demo activities)
→ M2 real content for one course → M3 Instructor Studio informed by M2 → later: accounts, sync,
instructor analytics, optional local conversational model.

Product identity lives in `config/product.ts` (name, domain, locale, owner display name).
