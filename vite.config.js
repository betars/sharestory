import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  esbuild: {
    jsx: 'automatic',
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  server: {
    hmr: {
      overlay: false
    }
  }
});