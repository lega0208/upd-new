# syntax=docker/dockerfile:1
FROM node:16-alpine3.15 as builder

ENV NODE_ENV=production

ENV NX_DAEMON=false

COPY ["package.json", "package-lock.json", "decorate-angular-cli.js", "./"]

RUN npm ci

COPY . .

RUN npm run build

RUN npm prune --production
