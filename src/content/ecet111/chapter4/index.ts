/**
 * Chapter 4 registry: add a topic here, and only here (course.ts never changes). One import
 * and one entry per topic, in the deck's order. Chapters with no topics yet are left out.
 */
import type { ModuleInput } from "../../schema";
import { halfAdderTopic } from "./half-adder";
import { fullAdderTopic } from "./full-adder";
import { decodersTopic } from "./decoders";
import { multiplexersTopic } from "./multiplexers";

export const chapter4: ModuleInput = {
  id: "chapter-4",
  title: "Chapter 4 · Combinational Logic Circuits",
  topics: [
    halfAdderTopic,
    fullAdderTopic,
    decodersTopic,
    multiplexersTopic,
  ],
};
