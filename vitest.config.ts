import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Core settings
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Performance and reliability
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Better for GitHub Actions
      },
    },

    // Better isolation and consistency
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,

    // Timeouts and CI friendliness
    testTimeout: 15000,
    hookTimeout: 10000,
    slowTestThreshold: 5000,

    // Output settings
    reporters: ['default', 'html', 'junit', 'json'],
    outputFile: {
      html: './coverage/html/report.html',
      json: './coverage/json/results.json',
      junit: './coverage/junit/junit.xml',
    },

    // Coverage settings
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts', 'src/__tests__/**', '**/node_modules/**'],
      all: true,
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
  },

  // Source path aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  // TypeScript settings
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    loader: 'ts',
    target: 'es2022',
  },
})
