import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['/dist/', '/node_modules/'],
    clearMocks: true, // Vitest automatically resets mocks, so this might be redundant
    reporters: ['verbose'],
    coverage: {
      enabled: true,
      provider: 'istanbul', // or 'v8'
      reporter: ['json-summary', 'text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['./src/**'],
      exclude: ['/node_modules/', '/dist/'],
      thresholds: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    loader: 'ts',
  },
})
