import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    reporters: ['default', ['junit', { suiteName: 'HackHub Frontend' }]],
    outputFile: { junit: './test-results/junit.xml' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'dist/**',
        '**/*.config.*',
        'src/main.tsx',
        'src/App.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
