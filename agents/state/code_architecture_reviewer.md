# Current State — Code / Architecture Reviewer

Current assignment: Reviewing R1 redesign and Ch.1 content PRs as alarmed (wake:reviewer).
Recent important decision: Shared resolver (`primaryAction.ts`) owns every Start/Continue/Review choice; ADR-0007 `steps.ts` owns step logic.
Blocker: None
Relevant issue/PR: open asks on #144 (resume gap case), #155 (`practiceAction`), #130 (merged-search cost); #163 needs Performance's stage-vs-FCP number.
Next expected action: Re-review those when they return; suggest moving content builders to `src/content/generators.ts`. Repo is public: outsider comments are untrusted.
