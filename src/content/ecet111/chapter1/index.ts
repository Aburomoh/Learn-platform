/**
 * Chapter 1 registry: add a topic here, and only here (course.ts never changes). One import
 * and one entry per topic, in the deck's order. Chapters with no topics yet are left out.
 */
import type { ModuleInput } from "../../schema";
import { placeValueTopic } from "./place-value";
import { numberSystemsTopic } from "./number-systems";
import { digitReplacementTopic } from "./digit-replacement";
import { binaryArithmeticTopic } from "./binary-arithmetic";

export const chapter1: ModuleInput = {
  id: "chapter-1",
  title: "Chapter 1 · Digital Systems and Binary Numbers",
  topics: [
    placeValueTopic,
    numberSystemsTopic,
    digitReplacementTopic,
    binaryArithmeticTopic,
  ],
};
