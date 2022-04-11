const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_QUERYSTRING } =
  process.env;

export const getDbConnectionString = (dbName = 'upd-test-discriminators') => {
  const connectionString = {
    production: `mongodb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_QUERYSTRING}/${dbName}`,
    development: `mongodb://localhost:27017/${dbName}`,
  };

  return process.env['NODE_ENV'] === 'production'
    ? connectionString.production
    : connectionString.development;
};
