/**
 * Arabic catalog. Add a key only when its instructor-approved translation exists; any key not
 * here falls back to `en`. Keep every `{slot}` from the English text (tested) and keep messages
 * as short as the English ones. `untranslatedKeys("ar")` lists what is still missing.
 */
import type { MessageKey } from "./en";

export const ar: Partial<Record<MessageKey, string>> = {};
