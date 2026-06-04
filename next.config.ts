import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["argon2"],
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
