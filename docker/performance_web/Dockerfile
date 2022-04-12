# syntax=docker/dockerfile:1
FROM node:16-alpine3.15

RUN npm install pm2 -g

USER node

ENV NODE_ENV=production

COPY dist/apps/api/ .

COPY .env .

EXPOSE 9000

CMD ["pm2-runtime", "main.js"]
