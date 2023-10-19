import { formatFiles, Tree } from '@nx/devkit';
import {
  addExportsToBarrel,
  addImportsToModule,
  generateNgrxFilesFromTemplates,
  normalizeOptions,
} from './lib';
import type { NgRxGeneratorOptions } from './schema';

export default async function (tree: Tree, options: NgRxGeneratorOptions) {
  const normalizedOptions = normalizeOptions(options);

  if (!tree.exists(normalizedOptions.module)) {
    throw new Error(`Module does not exist: ${normalizedOptions.module}.`);
  }

  if (!normalizedOptions.minimal || !normalizedOptions.root) {
    generateNgrxFilesFromTemplates(tree, normalizedOptions);
  }

  if (!normalizedOptions.skipImport) {
    addImportsToModule(tree, normalizedOptions);
    addExportsToBarrel(tree, normalizedOptions);
  }

  if (!normalizedOptions.skipFormat) {
    await formatFiles(tree);
  }
}
