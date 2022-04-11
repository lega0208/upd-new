# syntax=docker/dockerfile:1
FROM node:16-alpine3.15

USER node

ENV NODE_ENV=production

COPY --from=upd-node-base --chown=node:node api/ .

RUN npm install pm2 -g

EXPOSE 9000

CMD ["pm2-runtime", "main.js"]
