import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Browser code imports interaction components by file: the `@/interactions` barrel would pull
  // every component into one chunk and undo the per-kind chunks (ADR-0008, #260).
  {
    files: ["src/stage/**/*.{ts,tsx}", "src/kinds/**/*.{ts,tsx}", "src/shell/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { paths: [{ name: "@/interactions", message: "Import the component by file, e.g. @/interactions/BitRow/BitRow (ADR-0008)." }] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
