import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "playwright-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/generate-pptx": ["./node_modules/@sparticuz/chromium/**/*"],
  },
};

export default nextConfig;
