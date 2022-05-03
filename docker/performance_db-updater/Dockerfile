# syntax=docker/dockerfile:1
FROM node:16-alpine3.15

RUN apk update && apk add tzdata

ENV TZ=America/Toronto

RUN npm install pm2 -g

USER node

ENV NODE_ENV=production

COPY dist/apps/db-updater/ .

COPY .env .

COPY keys/ .

EXPOSE 9001

CMD ["pm2-runtime", "main.js"]
