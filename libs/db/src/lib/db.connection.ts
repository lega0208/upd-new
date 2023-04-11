const connectionString = {
  development: 'mongodb://127.0.0.1:27017/',
  production: 'mongodb://mongodb:27017/',
};

export const getDbConnectionString = (
  production: boolean,
  dbName = 'upd-test'
) =>
  `${
    production ? connectionString.production : connectionString.development
  }${dbName}`;
