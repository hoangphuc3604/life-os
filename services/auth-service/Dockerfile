FROM node:22-alpine

ARG NODE_ENV=dev
ENV NODE_ENV=$NODE_ENV

WORKDIR /usr/src/app

RUN apk add --no-cache openssl

COPY package*.json ./

RUN if [ "$NODE_ENV" = "prod" ]; then \
      npm ci --only=production; \
    else \
      npm install; \
    fi

COPY . .

RUN npx prisma generate && \
    if [ "$NODE_ENV" = "prod" ]; then \
      npm run build; \
    fi

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app && \
    rm -rf /usr/src/app/dist

USER nodejs

EXPOSE 3000

ENV PORT=3000

CMD ["npm", "run", "start:dev"]
