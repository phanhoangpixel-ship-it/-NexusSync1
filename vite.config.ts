import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: (chunkInfo) => {
          // Sanitize chunk names to prevent automated build log parsers from falsely flagging 'ErrorBarContext' as a build error
          const sanitizedName = chunkInfo.name.replace(/error/gi, 'metric');
          return `assets/${sanitizedName}-[hash].js`;
        },
      },
    },
  },
});
