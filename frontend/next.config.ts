import type { NextConfig } from "next";

const allowedOrigins = ['localhost:3000', 'frontend:3000'];

if (process.env.FRONTEND_URL) {
  try {
    allowedOrigins.push(new URL(process.env.FRONTEND_URL).host);
  } catch {
    // Ignore invalid FRONTEND_URL and fall back to the safe defaults above.
  }
}

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: [],
  },
  experimental: {
    serverActions: { allowedOrigins },
  },
};

export default nextConfig;
