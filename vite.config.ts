import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001/api',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
  ,
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('framer-motion')) return 'vendor-framer-motion';
            if (id.includes('supabase')) return 'vendor-supabase';
            if (id.includes('antd')) return 'vendor-antd';
            if (id.includes('react-icons')) return 'vendor-icons';
            return 'vendor';
          }
        }
      }
    }
  }
})
