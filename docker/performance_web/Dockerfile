# syntax=docker/dockerfile:1
FROM node:16-alpine3.13
ENV NODE_ENV=production

COPY ["package.json", "package-lock.json", "./"]

RUN npm install --production

COPY . .

EXPOSE 9000

CMD npx pm2-runtime start ./bin/www
