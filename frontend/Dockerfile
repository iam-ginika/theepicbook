FROM nginxinc/nginx-unprivileged:1.28-alpine
USER root
RUN rm -rf /usr/share/nginx/html/*
COPY public/ /usr/share/nginx/html/
USER 101
EXPOSE 8080
