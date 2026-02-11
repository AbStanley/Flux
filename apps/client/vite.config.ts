import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: './',
    plugins: [
      react(),
      checker({
        typescript: true,
        eslint: {
          useFlatConfig: true,
          lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
        },
      }),
    ],
    server: {
      port: parseInt(env.VITE_PORT || '5173'),
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET || 'http://127.0.0.1:3000',
          changeOrigin: true,
          timeout: 300000, // 5 minutes
          proxyTimeout: 300000,
        },
        '/anki': {
          target: 'http://127.0.0.1:8765',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/anki/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
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
          popup: path.resolve(__dirname, 'popup.html'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'content') {
              return 'assets/content.js';
            }
            if (chunkInfo.name === 'background') {
              return 'assets/background.js';
            }
            if (chunkInfo.name === 'popup') {
              return 'assets/popup.js';
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
  }
})
