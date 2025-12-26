import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['applicationinsights', 'diagnostic-channel-publishers'],
};

export default nextConfig;
