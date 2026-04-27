import type { NextConfig } from "next";

const browserApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const internalApiBaseUrl = process.env.INTERNAL_API_BASE_URL || browserApiBaseUrl;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${internalApiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
