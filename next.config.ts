import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // WDK depends on sodium-native; Node must load its platform prebuild directly.
  serverExternalPackages: ["@tetherto/wdk-wallet-spark", "sodium-native"],
};

export default nextConfig;
