import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-libsql', '@libsql/client', 'bcryptjs'],
};

export default nextConfig;
