import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: ESLint ignoreDuringBuilds option has been removed in Next.js 16
  // ESLint errors during builds are now handled differently

  // Fix Next.js 16 warning about workspace root detection
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
