import type { NextConfig } from "next";

async function redirects() {
  return [
    {
      source: '/',
      destination: '/home',
      permanent: false,
    },
  ]
}

const nextConfig: NextConfig = {
  redirects,
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  turbopack: {},
};

export default nextConfig;
