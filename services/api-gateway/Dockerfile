FROM nginx:alpine AS development
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/snippets/ /etc/nginx/snippets/
COPY nginx/conf.d/nginx.conf.dev /etc/nginx/conf.d/default.conf
RUN echo 'OK' > /usr/share/nginx/html/health.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM nginx:alpine AS production
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/snippets/ /etc/nginx/snippets/
COPY nginx/conf.d/nginx.conf.prod /etc/nginx/conf.d/default.conf
RUN echo 'OK' > /usr/share/nginx/html/health.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM nginx:alpine AS cloudrun
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/snippets/ /etc/nginx/snippets/
COPY nginx/conf.d/default.conf.cloudrun /etc/nginx/templates/default.conf.template
RUN echo 'OK' > /usr/share/nginx/html/health.html
EXPOSE 8080
ENV AUTH_SERVICE_URL=http://localhost:3000
ENV KNOWLEDGE_SERVICE_URL=http://localhost:3002
ENV AUTH_SERVICE_HOST=localhost
ENV KNOWLEDGE_SERVICE_HOST=localhost
CMD ["/bin/sh", "-c", "envsubst '${AUTH_SERVICE_URL} ${KNOWLEDGE_SERVICE_URL} ${AUTH_SERVICE_HOST} ${KNOWLEDGE_SERVICE_HOST}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
