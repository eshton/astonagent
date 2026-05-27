import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/client.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  external: ["next", "react", "next/server"],
  banner: ({ format }) => {
    // Only client.ts has "use client" — handled inline
    return format === "esm" ? {} : {};
  },
});
