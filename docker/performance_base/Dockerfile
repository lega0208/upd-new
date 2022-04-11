# syntax=docker/dockerfile:1
FROM node:16-alpine3.15 as builder

ENV NODE_ENV=production

COPY ["package.json", "package-lock.json", "decorate-angular-cli.js", "./"]

RUN npm ci

COPY . .

RUN npx nx run-many --target=build --projects=api,upd

COPY dist/apps/ .
