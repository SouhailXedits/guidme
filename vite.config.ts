/// <reference types="vitest" />
import path from "path";
import { defineConfig } from "vite";

const packageName = "guidme";

const fileName = {
  es: `${packageName}.mjs`,
  cjs: `${packageName}.cjs`,
  iife: `${packageName}.iife.js`,
};

const formats = Object.keys(fileName) as Array<keyof typeof fileName>;

module.exports = defineConfig({
  base: "./",
  build: {
    target: "ES2019",
    lib: {
      entry: path.resolve(__dirname, "src/guidme.ts"),
      name: packageName,
      formats,
      fileName: format => fileName[format],
    },
    rollupOptions: {
      output: {
        assetFileNames: assetInfo => {
          return assetInfo.name === "style.css" ? `guidme.css` : assetInfo.name as string;
        },
      },
    },
  },
  test: {},
});
