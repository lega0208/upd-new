export interface ColumnConfig {
  field: string;
  header: string;
  type?: 'link' | 'label';
  typeParam?: string;
  pipe?: 'number' | 'percent' | 'date';
  pipeParam?: any;
  tooltip?: string;
  translate?: boolean;
}

export interface typeParams {
  label: string;
  value: string;
}
