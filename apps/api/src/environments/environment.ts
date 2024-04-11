export const environment = {
  production: false,
  dbHost: process.env.DB_HOST,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisUsername: 'default',
  redisPassword: process.env.REDIS_PASSWORD,
};
