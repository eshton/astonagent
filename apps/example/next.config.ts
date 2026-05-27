import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  transpilePackages: [
    "@astonagent/core",
    "@astonagent/db",
    "@astonagent/next",
    "@astonagent/providers",
    "@astonagent/ui",
  ],
};

export default config;
