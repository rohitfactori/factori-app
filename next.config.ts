import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Pin the workspace root (a stray lockfile in the home dir confuses inference).
  turbopack: {
    root: path.resolve(),
  },
};

export default nextConfig;
