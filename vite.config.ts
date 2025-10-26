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
        target: 'http://localhost:3002',
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
    // Aumentamos el umbral de advertencia para chunks grandes y
    // definimos reglas de chunking manual para dependencias pesadas.
    chunkSizeWarningLimit: 1200, // KB
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Agrupar por librerías grandes / de uso común
          if (id.includes('react')) return 'vendor-react';
          if (id.includes('react-dom')) return 'vendor-react';
          if (id.includes('antd')) return 'vendor-antd';
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'vendor-charts';
          if (id.includes('@tanstack') || id.includes('react-query')) return 'vendor-query';
          if (id.includes('supabase')) return 'vendor-supabase';
          if (id.includes('framer-motion')) return 'vendor-framer-motion';
          if (id.includes('jspdf')) return 'vendor-jspdf';
          if (id.includes('swiper')) return 'vendor-swiper';
          if (id.includes('react-icons') || id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('axios') || id.includes('dayjs')) return 'vendor-utils';

          // Fallback: bundle restante de node_modules en 'vendor'
          return 'vendor';
        }
      }
    }
  }
})
