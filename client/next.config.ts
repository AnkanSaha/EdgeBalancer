import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Pin the workspace root — a stray lockfile in $HOME otherwise wins root inference.
  turbopack: { root: __dirname },
};

export default nextConfig;
