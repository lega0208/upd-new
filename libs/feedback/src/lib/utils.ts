import { type ReadJsonOptions, readJSON } from 'nodejs-polars';

export const toDataframe = (
  data: unknown,
  options?: Partial<ReadJsonOptions>,
) => {
  const json_data = JSON.stringify(data);
  const buff = Buffer.from(json_data);

  return readJSON(buff, { inferSchemaLength: 2 });
};
