import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      name: "addon-iframe-card.js",
      entry: "src/addon-iframe-card.ts",
    },
  },
});
