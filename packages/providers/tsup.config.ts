import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/anthropic.ts", "src/openai.ts", "src/ollama.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  external: ["@anthropic-ai/sdk", "openai"],
});
