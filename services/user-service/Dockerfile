FROM node:22-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY services/shared/package*.json ./services/shared/
COPY services/user-service/package*.json ./services/user-service/

RUN npm ci --silent

COPY services/shared/ ./services/shared/
COPY services/user-service/ ./services/user-service/

RUN npm run build -w @microservices/shared
RUN npm run build -w user-service

FROM node:22-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/services/shared/package*.json ./services/shared/
COPY --from=builder /usr/src/app/services/user-service/package*.json ./services/user-service/

RUN npm ci --omit=dev --silent

COPY --from=builder /usr/src/app/services/shared/dist ./services/shared/dist
COPY --from=builder /usr/src/app/services/user-service/dist ./services/user-service/dist

EXPOSE 8000

CMD ["npm", "run", "start", "-w", "services/user-service"]