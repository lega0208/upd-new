import type { OptionalKeyOf } from '@dua-upd/utils-common';

export type ColumnConfigPipe =
  | 'percent'
  | 'number'
  | 'date'
  | 'secondsToMinutes';

export interface ColumnConfig<T = any> {
  field: OptionalKeyOf<T>;
  header: string;
  type?: 'link' | 'comparison' | 'label' | 'text';
  typeParam?: string;
  typeParams?: typeParams;
  pipe?: ColumnConfigPipe;
  pipeParam?: string;
  tooltip?: string;
  translate?: boolean;
  filterConfig?: FilterConfig<T>;
  hide?: boolean;
  headerClass?: string;
  columnClass?: string;
  frozen?: boolean;
  indicator?: Indicator<T>;
}

export interface typeParams {
  link: string;
  preLink?: string;
  postLink?: string;
  external?: boolean;
}

export interface FilterConfig<T = any> {
  type: 'category' | 'boolean' | 'passFail' | 'pageStatus';
  categories?: { name: string; value: T[keyof T] | null }[];
}

export interface Indicator<T = any> {
  field: OptionalKeyOf<T>;
  upGoodDownBad?: boolean;
}