import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/erp",
        destination: "/erp-app/erp.html",
      },
      {
        source: "/erp/:path*",
        destination: "/erp-app/erp.html",
      },
    ];
  },
};

export default nextConfig;
