# 0001 — Web stack
Status: Accepted · Date: 2026-10-03 · Owner: Technical Lead

## Context
Vercel Hobby hosting, strict TypeScript, responsive web, minimal operating cost, no backend in M1.

## Decision
- Next.js 16.3 (App Router), React 19, TypeScript strict. Shell pages are Server Components;
  the Learning Stage is a Client Component subtree. All routes statically generated.
- Styling: CSS custom-property tokens + CSS Modules. No Tailwind, no UI kit, no animation library.
- Validation: Zod 4 for content schema (build/test time).
- Tests: Vitest 5 + Testing Library (unit), Playwright (smoke). ESLint via `eslint-config-next`.
- Node 24 (Vercel default). Versions verified with `npm view` on 2026-10-03.

## Consequences
Small bundle, no server cost, easy preview deployments. Interactive components must be written
by hand (accepted; they are the product).

## Alternatives considered
Vite SPA (loses static routing/metadata conveniences for no cost gain). Astro (weaker fit for a
highly interactive stage). Tailwind (not needed for a token-driven design system of this size).
