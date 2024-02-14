export const environment = {
  production: false,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisUsername: 'default',
  redisPassword: process.env.REDIS_PASSWORD,
};
