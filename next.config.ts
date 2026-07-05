import type { NextConfig } from "next";
import path from "path";

const normalizeDevOrigin = (value: string): string =>
  value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS?.split(",")
  .map((origin) => normalizeDevOrigin(origin))
  .filter(Boolean);

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/blogs",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/services/cooking-class/:path*",
        destination: "/services/cooking-classes/:path*",
        permanent: true,
      },
    ];
  },
  allowedDevOrigins: allowedDevOrigins?.length
    ? allowedDevOrigins
    : ["localhost", "127.0.0.1", "192.168.0.192"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
      },
    ],
  },
};

export default nextConfig;
