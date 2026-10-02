/**
 * Product identity. The only place where naming, domain and owner display text live.
 * Application logic must not hard-code any of these values.
 */
export const product = {
  name: "CET Learn",
  tagline: "Interactive course companion",
  /** Public origin for metadata; change here when the domain moves. */
  origin: "https://learn.aburomoh.com",
  owner: { displayName: "Dr. Mohannad Abu-Romoh", shortName: "Dr. Mohannad" },
  defaultLocale: "en" as const,
  supportedLocales: ["en", "ar"] as const,
  /** Namespace for browser storage keys (ADR-0005). */
  storagePrefix: "cet-learn:v1",
} as const;

export type Locale = (typeof product.supportedLocales)[number];
