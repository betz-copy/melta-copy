FROM node:22-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY services/cron-service/package*.json ./services/cron-service/

RUN npm ci --silent

COPY packages/shared/ ./packages/shared/
COPY services/cron-service ./services/cron-service/

RUN npm run build -w @microservices/shared
RUN npm run build -w cron-service



FROM node:22-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/packages/shared/package*.json ./packages/shared/
COPY --from=builder /usr/src/app/services/cron-service/package*.json ./services/cron-service/
COPY --from=builder /usr/src/app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /usr/src/app/services/cron-service/dist ./services/cron-service/dist

RUN npm ci --omit=dev --silent

EXPOSE 8000

CMD ["npm", "run", "start"]