import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve("."),
  },
  outputFileTracingRoot: path.resolve("."),
};

export default nextConfig;
