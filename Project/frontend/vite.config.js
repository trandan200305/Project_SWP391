import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/vnpt-api': {
        target: 'https://sandbox-idg.vnpt.vn',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/vnpt-api/, '')
      }
    }
  }
});
