export interface columnConfig {
  field: string;
  header: string;
  type?: string;
  typeParam?: string;
  pipe?: string;
  pipeParam?: any;
  tooltip?: string;
  translate?: boolean;
}

export interface typeParams {
  label: string;
  value: string;
}
