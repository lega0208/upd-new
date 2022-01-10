const {
  DB_HOST,
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_QUERYSTRING,
} = process.env;

const connectionString = {
  production: `mongodb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_QUERYSTRING}/upd-test`,
  development: 'mongodb://localhost:27017/upd-test'
};

export const getDbConnectionString = () => (
  process.env['NODE_ENV'] === 'production'
    ? connectionString.production
    : connectionString.development
);
