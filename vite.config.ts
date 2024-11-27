import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: '.',  // Add this line
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/main.ts',
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  base: './',  // Add this line
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});