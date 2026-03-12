import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  typescript: {
    // Allow production builds to complete even if type errors exist
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
