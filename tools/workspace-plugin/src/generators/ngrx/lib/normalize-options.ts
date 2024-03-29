import { names } from '@nx/devkit';
import type { NgRxGeneratorOptions } from '../schema';

export function normalizeOptions(
  options: NgRxGeneratorOptions
): NgRxGeneratorOptions {
  return {
    ...options,
    directory: names(options.directory).fileName,
  };
}
