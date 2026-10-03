import type { NextConfig } from "next";

// Fully static site (ADR-0001, COST_RULES): no server functions in M1.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // No floating Next.js badge over the student UI in development (R1 redesign, #110).
  devIndicators: false,
};

export default nextConfig;
