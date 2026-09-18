import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // A stray package-lock.json in the user's home directory otherwise makes
  // Next.js guess the workspace root one level too high.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
