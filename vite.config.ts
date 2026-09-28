/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Polling is needed for file watching to work inside a container.
    watch: {
      usePolling: true,
    },
  },
  preview: {
    host: true,
    port: 5173,
    // The E2E suite builds with VITE_API_BASE_URL=/api so the browser stays on
    // a single origin. The refresh cookie is then same-site and SameSite=lax
    // behaves as it does in local development. Pointing the bundle straight at
    // another host would be cross-site, and the browser would drop the refresh
    // cookie on every rotation -- silently breaking the session tests.
    proxy: {
      '/api': {
        target: process.env.E2E_API_TARGET ?? 'http://localhost:8000',
        changeOrigin: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // Vitest's default glob would collect tests/e2e/**/*.spec.ts and fail on
    // the @playwright/test import. Overriding `exclude` replaces the default
    // list, so the usual entries are repeated here.
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      // Without this vitest skips the coverage report when a test fails, and
      // the CI summary loses its input exactly when it is most useful.
      reportOnFailure: true,
      // cobertura feeds the GitLab MR coverage annotations; json-summary feeds
      // scripts/test-summary.mjs.
      reporter: ['text', 'text-summary', 'cobertura', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/setupTests.ts',
        'src/main.tsx',
      ],
    },
  },
});
