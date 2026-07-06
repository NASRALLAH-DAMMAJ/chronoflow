import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: false,
      filename: 'dist/bundle-stats.html',
      gzipSize: true,
    }),
  ],
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**'],
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          recharts: ['recharts'],
          supabase: ['@supabase/supabase-js'],
          pdf: ['@react-pdf/renderer'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})