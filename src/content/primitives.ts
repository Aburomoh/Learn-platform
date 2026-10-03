/** Schema building blocks shared by `schema.ts` and the kind specs in `src/kinds/<kind>/spec.ts`. */
import { z } from "zod";

export const id = z.string().regex(/^[a-z0-9][a-z0-9.-]*$/, "ids are lowercase, dot/dash separated");

/** Template text: `{name}` slots are filled from the variant's `vars`. */
export const template = z.string().min(1);
