import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(async ({ mode }) => {
  const plugins = [react()];
  if (mode !== "test" && !process.env.VITEST) {
    try {
      const { default: tailwindcss } = await import("@tailwindcss/vite");
      plugins.push(tailwindcss());
    } catch (e) {
      // Tailwind plugin optional in test/CI environment
    }
  }

  return {
    plugins,
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['backend/**', 'node_modules/**', 'dist/**', 'tests/e2e/**'],
      isolate: false,
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        reportsDirectory: './coverage',
      },
    },
  };
});
