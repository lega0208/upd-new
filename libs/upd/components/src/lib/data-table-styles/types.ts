import type { OptionalKeyOf } from '@dua-upd/utils-common'

export type ColumnConfigPipe = 'percent' | 'number' | 'date';

export interface ColumnConfig<T = any> {
  field: OptionalKeyOf<T>;
  header: string;
  type?: string;
  typeParam?: string;
  typeParams?: typeParams;
  pipe?: ColumnConfigPipe;
  pipeParam?: string;
  tooltip?: string;
  translate?: boolean;
}

export interface typeParams {
  link: string;
  preLink?: string;
  postLink?: string;
  external?: boolean;
}
