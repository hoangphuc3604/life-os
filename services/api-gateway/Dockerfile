# ========================================
# Multi-stage Dockerfile for API Gateway
# Supports: development, production, cloudrun
# ========================================

FROM nginx:alpine AS development
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/snippets /etc/nginx/snippets/
COPY nginx/conf.d/nginx.conf.dev /etc/nginx/conf.d/default.conf
RUN echo 'OK' > /usr/share/nginx/html/health.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM nginx:alpine AS production
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/snippets /etc/nginx/snippets/
COPY nginx/conf.d/nginx.conf.prod /etc/nginx/conf.d/default.conf
RUN echo 'OK' > /usr/share/nginx/html/health.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM nginx:alpine AS cloudrun
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/snippets /etc/nginx/snippets/
COPY nginx/conf.d/default.conf.cloudrun /etc/nginx/conf.d/default.conf
RUN echo 'OK' > /usr/share/nginx/html/health.html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
