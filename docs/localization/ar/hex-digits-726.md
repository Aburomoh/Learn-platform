# Arabic for the Hex digits practice changes (#726)

**Status: PROPOSAL for the owner's approval.** Content Engineer, 2026-10-14. Three new English strings, drafted with the approved vocabulary of the same practice («Hex», «Bits», «Weight», «Letters»). No entry is in the package until approved; until then Arabic mode shows the English for these three.

What changed (PR #727, Auditor audit #726): the first hint is a pointer instead of the answer, and distractors built for known slips now name the slip when picked. The table hint and the weights hint keep their approved text (moved one rung down).

| Where | English | Proposed Arabic | Notes |
|---|---|---|---|
| Hint rung 2 (all three questions) | Not yet. After 9, hex uses letters: count on from A = 10. | ليس بعد. بعد 9 يستخدم Hex الحروف: عُدّ ابتداءً من A = 10. | «ليس بعد.» is dropped by the unchecked-hint rule (#717). |
| Nudge `ns.hex-neighbour` (next or previous letter picked) | Close, but check the count: A = 10, and each letter after it is one more. | قريب، لكن راجع العدّ: A = 10، وكل حرف بعده يزيد بمقدار واحد. | |
| Nudge `ns.bits-neighbour` (the bits of the next or previous digit picked) | Those bits stand for the next or the previous digit. Add the weights 8, 4, 2, 1 where there is a 1. | هذه الـ Bits تمثل الرقم التالي أو السابق. اجمع الأوزان 8 و4 و2 و1 حيث يوجد 1. | «الرقم» for digit, as «رقمين» in the approved «ns.hex-letter». |

Already approved and reused: «In hex, 10 to 15 are single letters A to F, not two digits.» for the decimal-as-written slip; «Those bits are in reverse order…» for the reversed bits.
