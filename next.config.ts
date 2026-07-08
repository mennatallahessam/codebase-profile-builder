import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/((?!api|_next|static|favicon.ico|file.svg).*)',
        destination: '/index.html',
      },
    ];
  },
};

export default nextConfig;
