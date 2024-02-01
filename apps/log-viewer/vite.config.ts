/// <reference types="vitest" />
import { defineConfig } from 'vite';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
console.log(process.cwd());
export default defineConfig({
  root: __dirname,
  build: {
    outDir: '../../dist/apps/log-viewer',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
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

  plugins: [nxViteTsPaths()],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [
  //    viteTsConfigPaths({
  //      root: '../../',
  //    }),
  //  ],
  // },
});
