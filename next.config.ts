import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.15.6", "192.168.15.12"],
  env: {
    NEXT_PUBLIC_MP_PUBLIC_KEY: process.env.MP_PUBLIC_KEY,
  },
};

export default nextConfig;
