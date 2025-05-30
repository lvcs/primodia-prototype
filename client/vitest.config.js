import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    globals: true,
    css: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/e2e/**',
      '**/*.e2e.*',
      '**/*.spec.js',
    ],
    include: [
      'test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.config.js',
        '**/*.config.ts',
        'dist/',
        'build/',
        '**/e2e/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@assets': resolve(__dirname, './src/assets'),
      '@config': resolve(__dirname, './src/config'),
      '@game': resolve(__dirname, './src'),
      '@stores': resolve(__dirname, './src/stores'),
      '@styles': resolve(__dirname, './src/styles'),
      '@ui': resolve(__dirname, './src/ui'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },
}) 