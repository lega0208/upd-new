import { replaceFiles } from '@nx/vite/plugins/rollup-replace-files.plugin';
import { resolve } from 'path';
import { defineConfig, splitVendorChunkPlugin, type AliasOptions } from 'vite';
import { angular } from './vite-plugin/plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import { visualizer } from 'rollup-plugin-visualizer';

import purgecss from '@fullhuman/postcss-purgecss';

const workspaceRoot = resolve(__dirname, '../..');
const projectRoot = resolve(workspaceRoot, 'apps/upd');

export default defineConfig(({ mode }) => {
  const prod = mode === 'production';

  return {
    root: __dirname,
    base: '/',
    // root: projectRoot,
    mode,
    esbuild: {
      logLevel: 'info',
      format: 'esm',
      treeShaking: prod,
      platform: 'browser',
      color: true,
    },
    build: {
      commonjsOptions: { transformMixedEsModules: true },
      sourcemap: prod ? 'hidden' : 'inline',
      outDir: resolve(workspaceRoot, 'dist/apps/upd'),
      assetsDir: './',
      reportCompressedSize: true,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          dir: resolve(workspaceRoot, 'dist/apps/upd'),
        },
        logLevel: 'info',
        treeshake: prod,
        cache: true,
        plugins: prod
          ? [
              replaceFiles([
                {
                  replace: 'apps/upd/src/environments/environment.ts',
                  with: 'apps/upd/src/environments/environment.prod.ts',
                },
              ]),
            ]
          : [visualizer() as any],
        external: prod && ['core-js', 'html2canvas', 'canvg', 'dompurify'],
      },
      minify: prod,
      cssMinify: prod,
    },
    optimizeDeps: {
      include: [
        '@angular/common',
        '@angular/common/http',
        '@angular/core/rxjs-interop',
        'dayjs',
        'zone.js',
      ],
    },
    server: {
      proxy: {
        '/api': `http://localhost:${process.env['PORT'] || 9000}`,
      },
    },
    logLevel: 'info',
    json: {
      stringify: true,
    },
    plugins: [
      tsconfigPaths({
        root: workspaceRoot,
      }),
      angular({
        typecheck: true,
        workspaceRoot: projectRoot,
        tsConfigPath: 'tsconfig.json',
      }),
      splitVendorChunkPlugin(),
    ],
    preview: {
      proxy: {
        '/api': `http://localhost:${process.env['PORT'] || 9000}`,
      },
    },
  };
});
