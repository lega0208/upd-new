
export const getDbConnectionString = (dbName = 'upd-test') => {
  const connectionString = {
    production: `mongodb://mongodb:27017/${dbName}`,
    development: `mongodb://localhost:27017/${dbName}`,
  };

  return process.env['NODE_ENV'] === 'production'
    ? connectionString.production
    : connectionString.development;
};
