import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

// Configuración del adaptador Cloudflare para Next.js
const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  experimental: {
    serverMinification: false,
  },
};

export default nextConfig;
