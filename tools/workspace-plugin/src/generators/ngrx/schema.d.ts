export interface NgRxGeneratorOptions {
  directory: string;
  minimal: boolean;
  module: string;
  name: string;
  useDataPersistence: boolean;
  barrels?: boolean;
  facade?: boolean;
  root?: boolean;
  skipFormat?: boolean;
  skipImport?: boolean;
  syntax?: 'classes' | 'creators';
}
