import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  root: '.', // Ensure this is the correct root of your project
  plugins: [
    react(), // React plugin for Vite
    electron([
      {
        // Main process entry file
        entry: 'src/main/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron', // Output for Electron main process files
          },
        },
      },
      {
        // Preload script entry
        entry: 'src/main/preload.ts',
        onstart(options) {
          options.reload(); // Auto-reload during development
        },
      },
    ]),
    renderer(), // Renderer plugin for Electron
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'), // Matches tsconfig.json paths alias
    },
  },
  base: process.env.ELECTRON_RENDERER_URL ? '/' : './', // Dynamic base URL
  css: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')], // Tailwind and Autoprefixer
    },
  },
  build: {
    outDir: 'dist', // Output folder for renderer files
    emptyOutDir: true, // Clean the folder before building
  },
});
