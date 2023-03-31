/// <reference types="vitest" />
import { defineConfig } from 'vite';

import viteTsConfigPaths from 'vite-tsconfig-paths';
console.log(process.cwd());
export default defineConfig({
  cacheDir: '../../node_modules/.vite/log-viewer',

  server: {
    port: 5173,
    host: 'localhost',
    open: '/index.html',
  },

  preview: {
    port: 5174,
    host: 'localhost',
  },

  plugins: [
    viteTsConfigPaths({
      root: '../../',
    }),
  ],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [
  //    viteTsConfigPaths({
  //      root: '../../',
  //    }),
  //  ],
  // },
});
