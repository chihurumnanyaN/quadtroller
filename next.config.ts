import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  experimental: {
    agentFeedback: true,
  },
};

export default nextConfig;
