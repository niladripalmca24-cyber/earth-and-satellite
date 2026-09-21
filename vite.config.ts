import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '10000', 10),
    allowedHosts: true,
  },
});
