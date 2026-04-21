import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "success-cup-resort-audit.trycloudflare.com",
    "ears-catherine-huntington-translator.trycloudflare.com",
    "maintaining-excellent-screensaver-dip.trycloudflare.com",
    "maintaining-excellent-screensaver-dip.trycloudflare.com.",
  ],
  async headers() {
    return [
      {
        source: "/firebase-messaging-sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
    ];
  },
};

export default nextConfig;
