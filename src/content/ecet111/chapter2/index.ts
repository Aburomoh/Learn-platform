/**
 * Chapter 2 registry: add a topic here, and only here (course.ts never changes). One import
 * and one entry per topic, in the deck's order. Chapters with no topics yet are left out.
 */
import type { ModuleInput } from "../../schema";
import { basicGatesTopic } from "./basic-gates";
import { derivedGatesTopic } from "./derived-gates";
import { sopPosTopic } from "./sop-pos";
import { lawsAndRulesTopic } from "./laws-and-rules";
import { simplificationTopic } from "./simplification";
import { deMorganTopic } from "./de-morgan";
import { mintermsTopic } from "./minterms";

export const chapter2: ModuleInput = {
  id: "chapter-2",
  title: "Chapter 2 · Boolean Algebra and Logic Gates",
  topics: [
    basicGatesTopic,
    derivedGatesTopic,
    sopPosTopic,
    lawsAndRulesTopic,
    simplificationTopic,
    deMorganTopic,
    mintermsTopic,
  ],
};
