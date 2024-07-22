import { type ReadJsonOptions, readJSON, scanParquet } from 'nodejs-polars';

export const toDataframe = (
  data: unknown,
  options?: Partial<ReadJsonOptions>,
) => {
  const json_data = JSON.stringify(data);
  const buff = Buffer.from(json_data);

  return readJSON(buff, { inferSchemaLength: 10, ...options });
};

export function getLazyDf(filepath: string) {
  return scanParquet(filepath, { // 'az://raw-data/feedback/feedback.parquet'
    cloudOptions: new Map([
      ['azure_storage_connection_string', process.env['AZURE_STORAGE_CONNECTION_STRING'] as string],
      ['azure_storage_account_name', process.env['AZURE_STORAGE_ACCOUNT_NAME'] as string],
      ['azure_storage_account_key', process.env['AZURE_STORAGE_ACCOUNT_KEY'] as string],
      ['azure_storage_endpoint', process.env['AZURE_STORAGE_ENDPOINT'] as string],
    ]),
  });
}