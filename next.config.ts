import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Native-style Yahoo chart client — keep out of the client bundle */
  serverExternalPackages: ["yahoo-finance2"],
};

export default nextConfig;
