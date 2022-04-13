
export const getDbConnectionString = (dbName = 'upd-test') => {
  const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_QUERYSTRING } =
    process.env;

  const connectionString = {
    production: `mongodb://mongodb:27017/${dbName}`,
    development: `mongodb://localhost:27017/${dbName}`,
  };

  return process.env['NODE_ENV'] === 'production'
    ? connectionString.production
    : connectionString.development;
};
