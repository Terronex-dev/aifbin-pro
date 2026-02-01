import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    host: true, // Expose to network
    strictPort: false,
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
