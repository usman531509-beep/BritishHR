import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root (multiple lockfiles exist in parent dirs).
  turbopack: {
    root: path.join(__dirname),
  },
  // Hide the on-screen dev indicator badge that overlaps the sidebar footer.
  devIndicators: false,
};

export default nextConfig;
