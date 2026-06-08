import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['text', 'text-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.config.*',
        '**/__tests__/**',
        '**/*.d.ts',
        'src/test/**',
        'src/main.ts',
        'build-skia/**',
        'wasm/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
