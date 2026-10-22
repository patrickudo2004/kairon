import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isElectronBuild = process.env.ELECTRON_BUILD === 'true' || env.ELECTRON_BUILD === 'true';
  return {
    base: isElectronBuild ? './' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      watch: {
        ignored: ['**/playwright-report/**', '**/test-results/**']
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
      },
    },
    plugins: [
      react(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
