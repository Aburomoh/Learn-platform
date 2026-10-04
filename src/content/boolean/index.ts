/** Boolean algebra for Chapters 2–5 (#197): course truth, computed, never authored by hand. */
export { parseBool, BooleanParseError, MAX_LENGTH, MAX_DEPTH, type BoolExpr, type ParseOptions } from "./parse";
export { evaluate, variablesOf, envFor, truthTable, mintermsOf, sigma, parseSigma, equivalent, literalCount, isSOP, isPOS, formatBool, type Env, type TruthRow } from "./logic";
export { primeImplicants, minimalCovers, MAX_VARIABLES, minimalSOP, formatCube, formatCover, cubeLiterals, covers, type Cube } from "./minimize";
