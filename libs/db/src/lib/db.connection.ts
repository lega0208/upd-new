const connectionString = {
  development: 'mongodb://localhost:27017/',
  production: 'mongodb://mongodb:27017/',
};

export const getDbConnectionString = (
  production: boolean,
  dbName = 'upd-test'
) =>
  `${
    production ? connectionString.production : connectionString.development
  }${dbName}`;
