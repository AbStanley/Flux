import path from "path"
import { defineConfig } from 'vitest/config'
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
    port: parseInt(process.env.VITE_PORT || '5173'),
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3002',
        changeOrigin: true,
      },
      '/anki': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/anki/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('Origin', 'http://127.0.0.1:8765');
          });
        },
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
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
