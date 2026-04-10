import { defineConfig } from 'vite';

export default defineConfig({
  base: '/seimyaku-resistance/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/phaser')) {
            return 'phaser';
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
