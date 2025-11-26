import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
    incomingRequests: {
      ignore: [/\/api\/v1\/health/],
    },
  },
  experimental: {
    // Increase body size limit for file uploads
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
