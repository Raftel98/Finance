import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["argon2"],
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
