# syntax=docker/dockerfile:1.3
FROM node:16-alpine3.17 as builder
WORKDIR builder
VOLUME ["/builder"]
COPY ["package.json", "package-lock.json", "decorate-angular-cli.js", "./"]
RUN --mount=type=cache,target=/home/node/.npm npm ci
COPY ./angular.json ./nx.json /tsconfig.base.json ./
COPY ./apps/ ./apps
COPY ./libs/ ./libs
RUN npx nx run-many --target=build --projects=api,upd,db-updater,db-cli --prod --parallel
RUN rm -r /builder/node_modules && rm -r /builder/.angular && rm -r /builder/tmp

FROM alpine:latest as apps
WORKDIR apps
COPY --from=builder /builder/dist/apps/ .

FROM node:16-alpine3.17 as node_base
RUN apk update && apk add tzdata
ENV TZ=America/Toronto
RUN npm install pm2 -g

FROM node_base as web
COPY --from=apps apps/api/package.json .
RUN --mount=type=cache,target=/home/node/.npm npm install
COPY --from=apps apps/api/ .
#COPY .env .
EXPOSE 9000
USER node
CMD ["pm2-runtime", "main.js"]

FROM node_base as db-updater
RUN echo -e '#!/bin/sh\nnode db-cli/main.js "$@"' >> /bin/db-cli && chmod +x /bin/db-cli
COPY --from=apps apps/db-updater/package.json .
RUN --mount=type=cache,target=/home/node/.npm npm install
COPY --from=apps apps/db-updater/ .
COPY --from=apps apps/db-cli/ db-cli/
#COPY .env .
#COPY keys keys/
#COPY .env db-cli/
#COPY keys db-cli/keys/
EXPOSE 9001
USER node
CMD ["pm2-runtime", "main.js"]

FROM nginx:alpine as nginx
RUN apk update && apk add tzdata
ENV TZ=America/Toronto
COPY --from=apps apps/upd/ /var/www/html/
COPY docker/performance_nginx/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
EXPOSE 443

FROM nginx:alpine as nginx-dev
RUN apk update && apk add tzdata
ENV TZ=America/Toronto
COPY --from=apps apps/upd/ /var/www/html/
COPY docker/performance_nginx/nginx.dev.conf /etc/nginx/nginx.conf
EXPOSE 8080
