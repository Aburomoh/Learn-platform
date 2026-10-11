# CET Learn Arabic translation package

This package contains the complete Arabic draft for the supplied Phase-1 localization inventory.

## Files

- `source-texts.ar.json` — all 3,771 inventory entries with a new `arabic` field; original IDs, English text, metadata, occurrence data and slots are preserved.
- `TECHNICAL_GLOSSARY_AR.md` — working technical-term classification and Arabic secondary glosses.
- `TRANSLATION_REVIEW_NOTES.md` — language/style decisions, bidirectional-text requirements, and implementation caveats.
- `VALIDATION_REPORT.md` — structural checks and counts.

## Important

This is a translation package, not the Phase-2 code implementation. Questions remain English by design. The UI still needs the `EN | عربي` control, persistence, RTL/LTR isolation and localization of/refactoring for component strings identified in the Phase-1 audit.
