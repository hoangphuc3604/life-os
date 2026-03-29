FROM node:22-alpine AS builder

ARG NODE_ENV=dev
ENV NODE_ENV=$NODE_ENV

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_API_GATEWAY_URL
ENV VITE_API_GATEWAY_URL=${VITE_API_GATEWAY_URL:-http://localhost:8080}

RUN npm run build

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
