import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    hmr: {
      overlay: true
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
}); 