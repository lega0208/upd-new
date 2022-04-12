# syntax=docker/dockerfile:1
FROM nginx:alpine

COPY docker/performance_nginx/nginx.conf /etc/nginx/nginx.conf

COPY dist/apps/upd/ /var/www/html/

EXPOSE 81
