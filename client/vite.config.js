import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000, // Different port from the old client
    open: true,
    hmr: {
      overlay: true
    }
  },
  build: {
    outDir: './dist', // Output within the client directory
    emptyOutDir: true,
  }
}); 