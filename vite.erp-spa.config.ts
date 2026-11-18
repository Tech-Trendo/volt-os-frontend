import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Dedicated Vite client-SPA build for hosting the Volt OS ERP inside the unified
 * Next.js Vercel project at https://www.voltos.techtrendo.com/erp.
 * Does NOT modify vite.config.ts so the Lovable TanStack Start build stays intact.
 */
export default defineConfig({
  base: "/erp-app/",
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  define: {
    "import.meta.env.VITE_ERP_SPA": JSON.stringify("true"),
    "import.meta.env.VITE_ERP_BASE_PATH": JSON.stringify(process.env.VITE_ERP_BASE_PATH || "/erp"),
    "import.meta.env.VITE_USE_MOCK": JSON.stringify("false"),
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
      process.env.VITE_API_BASE_URL ||
        process.env.ERP_API_BASE_URL ||
        "https://app.voltos.techtrendo.com/api",
    ),
    "import.meta.env.VITE_STOREFRONT_URL": JSON.stringify(
      process.env.VITE_STOREFRONT_URL ||
        process.env.STOREFRONT_URL ||
        "https://www.voltos.techtrendo.com",
    ),
  },
  build: {
    outDir: path.resolve(__dirname, "storefront/public/erp-app"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "erp.html"),
    },
  },
});
