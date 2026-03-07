import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Plugin to stub out figma:asset/* imports with empty placeholder
function figmaAssetsPlugin() {
  return {
    name: "figma-assets-stub",
    resolveId(id: string) {
      if (id.startsWith("figma:")) {
        return "\0figma-stub:" + id;
      }
    },
    load(id: string) {
      if (id.startsWith("\0figma-stub:")) {
        return `export default "";`;
      }
    },
  };
}

export default defineConfig({
  plugins: [
    figmaAssetsPlugin(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/app"),
    },
  },
});
