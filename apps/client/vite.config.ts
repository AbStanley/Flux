import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    checker({ typescript: true }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        content: path.resolve(__dirname, 'src/content/index.tsx'),
        background: path.resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content') {
            return 'assets/content.js';
          }
          if (chunkInfo.name === 'background') {
            return 'assets/background.js';
          }
          return 'assets/[name]-[hash].js';
        },
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // PDF.js is very large, keep it separate
            if (id.includes('pdfjs-dist') || id.includes('react-pdf')) {
              return 'vendor-pdf';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
