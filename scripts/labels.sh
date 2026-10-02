#!/usr/bin/env bash
# Idempotently creates the repository labels used by the wake protocol and task scheme.
# Usage: scripts/labels.sh [owner/repo]
set -euo pipefail
REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
mk() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null && echo "label: $1"; }

mk task              "0e8a16" "One coherent change"
mk "milestone:M1"    "1d76db" "First vertical slice"
mk "level:L1"        "c5def5" "Tiny isolated change"
mk "level:L2"        "bfd4f2" "Normal feature"
mk "level:L3"        "7fa7e0" "Core interaction / data / tutoring"
mk "level:L4"        "4c6ef5" "Auth, privacy, architecture, migrations"
mk ready             "fbca04" "Task is ready to start"
mk "wake:reviewer"   "f9d0c4" "Code / Architecture Reviewer should act"
mk "wake:qa"         "f9d0c4" "QA / Test Engineer should act"
mk "wake:tech-lead"  "f9d0c4" "Technical Lead should merge or decide"
mk "wake:product-manager" "f9d0c4" "Product Manager should pick next work"
mk "qa:passed"       "0e8a16" "QA checks passed"
mk blocked           "d93f0b" "Escalation required"
mk "blocked:architecture" "d93f0b" "Needs Technical Lead decision"
mk "blocked:product" "d93f0b" "Needs Product Manager decision"
mk "pedagogy-review" "e99695" "Pedagogy Engineer should review"
mk "security-sensitive" "b60205" "Security / Privacy Engineer should review"
mk "performance-risk" "fef2c0" "Performance / Stress Engineer should review"
mk "release-ready"   "5319e7" "Release / DevOps Engineer should act"
mk "owner-decision"  "000000" "Needs Dr. Mohannad"
