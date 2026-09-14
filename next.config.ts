import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // 固定於此獨立專案，避免上層 lockfile 擴大檔案搜尋範圍。
    root: process.cwd(),
  },
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
