import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Dev proxy: forward /api/* to the Express server (apps/server, port 3100).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3100',
    },
  },
});
