import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Cloudinary — where the backend uploads photos and generated posters (cloudinary.ts)
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Local backend during development, e.g. http://localhost:5000/uploads/...
      { protocol: "http", hostname: "localhost", port: "5000" },
    ],
  },
};

export default nextConfig;
