/**
 * DEMO / NOT AUTHORITATIVE COURSE CONTENT
 * Demo course used to validate the learning architecture. Replace with instructor-approved
 * content before any production release. Every entity below is stamped authority: "DEMO".
 */
import type { CourseInput } from "../schema";
import { placeValueTopic } from "./chapter1/place-value";
import { numberSystemsTopic } from "./chapter1/number-systems";
import { binaryArithmeticTopic } from "./chapter1/binary-arithmetic";
import { basicGatesTopic } from "./chapter2/basic-gates";
import { sopPosTopic } from "./chapter2/sop-pos";
import { lawsAndRulesTopic } from "./chapter2/laws-and-rules";
import { simplificationTopic } from "./chapter2/simplification";
import { deMorganTopic } from "./chapter2/de-morgan";

export const ecet111: CourseInput = {
  id: "ecet111",
  code: "ECET 111",
  title: "Introduction to Digital System Design I",
  summary: "Number systems and binary arithmetic, one step at a time: convert between bases, add, complement and subtract. Plus a first look at logic gates.",
  authority: "DEMO",
  offeringId: "ecet111.2026-fall",
  modules: [
    {
      id: "chapter-1",
      title: "Chapter 1 · Digital Systems and Binary Numbers",
      topics: [
        placeValueTopic,
        numberSystemsTopic,
        binaryArithmeticTopic,
      ],
    },
    {
      id: "chapter-2",
      title: "Chapter 2 · Boolean Algebra and Logic Gates",
      topics: [basicGatesTopic, sopPosTopic, lawsAndRulesTopic, simplificationTopic, deMorganTopic],
    },
  ],
};
