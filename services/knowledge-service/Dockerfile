FROM node:22-alpine AS development

WORKDIR /usr/src/app

RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN mkdir -p uploads

RUN npm run build

FROM node:22-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm install --only=production

COPY prisma ./prisma/
RUN npx prisma generate

COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/uploads ./uploads

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

CMD ["./docker-entrypoint.sh", "node", "dist/main"]
