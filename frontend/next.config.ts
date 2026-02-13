import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/theadmin",
          destination: `${BACKEND_URL}/theadmin/`,
        },
        {
          source: "/theadmin/:path+",
          destination: `${BACKEND_URL}/theadmin/:path+/`,
        },
        {
          source: "/static/:path*",
          destination: `${BACKEND_URL}/static/:path*`,
        },
      ],
      afterFiles: [],
      fallback: [
        {
          source: "/api/:path*",
          destination: `${BACKEND_URL}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
