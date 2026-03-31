FROM node:22-alpine AS base
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci

FROM base AS development
COPY . .
RUN npx prisma generate
RUN mkdir -p uploads
EXPOSE 3002
ENV PORT=3002
CMD ["npm", "run", "start:dev"]

FROM base AS build
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
COPY --chown=nodejs:nodejs --from=build /usr/src/app/package*.json ./
COPY --chown=nodejs:nodejs --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=build /usr/src/app/dist ./dist
COPY --chown=nodejs:nodejs --from=build /usr/src/app/prisma ./prisma
RUN mkdir -p uploads && chown nodejs:nodejs uploads
USER nodejs
EXPOSE 3002
ENV PORT=3002
CMD ["node", "dist/main.js"]

FROM production AS cloudrun
COPY --chown=nodejs:nodejs cloud-run-entrypoint.sh ./cloud-run-entrypoint.sh
RUN chmod +x cloud-run-entrypoint.sh
ENV PORT=8080
EXPOSE 8080
CMD ["./cloud-run-entrypoint.sh"]
