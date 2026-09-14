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
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
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
