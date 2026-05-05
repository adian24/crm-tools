import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "playwright-core", "pptxgenjs", "@sparticuz/chromium"],
};

export default nextConfig;
