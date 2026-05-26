import type { NextConfig } from "next";
import path from "path";

const basePath = process.env.DEMO_BASE_PATH?.replace(/\/$/, "") || "";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
