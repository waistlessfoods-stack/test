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
        source: "/blog/5-easy-meal-prep-ideas",
        destination: "/blog/the-chefs-guide-to-herbs",
        permanent: true,
      },
      {
        source: "/services/cooking-class/:path*",
        destination: "/services/cooking-classes/:path*",
        permanent: true,
      },
      {
        source: "/recipes/detail/apple-peanut-donut-bites/:path*",
        destination: "/recipes/detail/triple-berry-french-toast/:path*",
        permanent: true,
      },
      {
        source: "/shop/apple-peanut-donut-bites",
        destination: "/shop/triple-berry-french-toast",
        permanent: true,
      },
      {
        source: "/recipes/detail/almond-fudge-brownie/:path*",
        destination: "/recipes/detail/harvest-stuffed-mushrooms/:path*",
        permanent: true,
      },
      {
        source: "/shop/almond-fudge-brownie",
        destination: "/shop/harvest-stuffed-mushrooms",
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
    ],
  },
};

export default nextConfig;
