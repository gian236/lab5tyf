import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // WDK depends on sodium-native; Node must load its platform prebuild directly.
  serverExternalPackages: ["@tetherto/wdk-wallet-spark", "sodium-native"],
  // sodium-native resolves its addon dynamically, so automatic file tracing
  // cannot discover the Linux binary required by Vercel Functions.
  outputFileTracingIncludes: {
    "/api/*": ["./node_modules/sodium-native/prebuilds/linux-x64/**/*"],
  },
};

export default nextConfig;
