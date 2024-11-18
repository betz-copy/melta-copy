FROM node:22-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY services/shared/package*.json ./services/shared/
COPY services/global-search-service/package*.json ./services/global-search-service/

RUN npm ci --silent

COPY services/shared/ ./services/shared/
COPY services/global-search-service ./services/global-search-service/

RUN npm run build -w @microservices/shared
RUN npm run build -w global-search-service

FROM node:22-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/services/shared/package*.json ./services/shared/
COPY --from=builder /usr/src/app/services/global-search-service/package*.json ./services/global-search-service/

RUN npm ci --omit=dev --silent

COPY --from=builder /usr/src/app/services/shared/dist ./services/shared/dist
COPY --from=builder /usr/src/app/services/global-search-service/dist ./services/global-search-service/dist

EXPOSE 8000

CMD ["npm", "run", "start", "-w", "services/global-search-service"]