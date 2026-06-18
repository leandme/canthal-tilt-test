import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/ads.txt",
        destination:
          "https://srv.adstxtmanager.com/19390/canthaltilttest.com",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
