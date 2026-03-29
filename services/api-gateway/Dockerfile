FROM nginx:alpine

ARG NODE_ENV=dev
ENV NODE_ENV=$NODE_ENV

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx/snippets /etc/nginx/snippets/
COPY nginx/conf.d/nginx.conf.${NODE_ENV} /etc/nginx/conf.d/default.conf

RUN echo 'OK' > /usr/share/nginx/html/health.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
