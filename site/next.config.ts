import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // A stray package-lock.json in the user's home directory otherwise makes
  // Next.js guess the workspace root one level too high.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    // next/image refuses to optimize from a host it doesn't know about.
    // Wildcarded so it keeps working if MEDIA_BASE_URL ever points at a
    // different Supabase project (re-provisioned, staging, etc.) without
    // needing this file touched again.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
