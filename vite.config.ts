import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          { src: 'manifest.json', dest: '.' },
          { src: 'sw.js', dest: '.' },
          { src: 'icon.png', dest: '.' },
          { src: 'api/*', dest: 'api' },
          { src: '.htaccess', dest: '.' },
          { src: '.env', dest: '.' },
          { src: 'server.js', dest: '.' },
          { src: 'package.json', dest: '.' }
        ]
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      target: 'esnext'
    }
  };
});