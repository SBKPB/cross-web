import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.cross.twinhao.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
