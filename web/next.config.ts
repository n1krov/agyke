import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.modules = [
      path.resolve(process.cwd(), 'node_modules'),
      'node_modules',
      ...(config.resolve.modules || []),
    ];
    return config;
  },
};

export default nextConfig;
