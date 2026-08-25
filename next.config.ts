import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Emits `.next/standalone` — a self-contained server with only the node_modules it
   * actually imports. The Docker runtime stage copies that instead of the full
   * dependency tree, which is the difference between a ~200 MB and a ~1 GB image.
   *
   * `next dev` and `next start` are unaffected; this only adds an extra build output.
   */
  output: "standalone",
};

export default nextConfig;
