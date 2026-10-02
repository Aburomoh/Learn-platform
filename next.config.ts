import type { NextConfig } from "next";

// Fully static site (ADR-0001, COST_RULES): no server functions in M1.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
