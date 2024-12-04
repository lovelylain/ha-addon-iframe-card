import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      name: "addon-iframe-card",
      entry: "src/addon-iframe-card.ts",
      formats: ["umd"],
      fileName: () => "addon-iframe-card.js",
    },
  },
});
