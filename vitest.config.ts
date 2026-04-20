import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.ts', 'netlify/functions/**/*.test.ts'],
    passWithNoTests: true,
  },
});
