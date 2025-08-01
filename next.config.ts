import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "watch.umroo.art",
        port: "",
        pathname: "/**",
      },
    ]
  }
};

export default nextConfig;
