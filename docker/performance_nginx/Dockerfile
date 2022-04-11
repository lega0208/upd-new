# syntax=docker/dockerfile:1
FROM nginx:alpine

COPY docker/performance_nginx/nginx.conf /etc/nginx/nginx.conf

COPY --from=upd-node-base upd/ /var/www/html/


