FROM node:22-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY services/shared/package*.json ./services/shared/
COPY services/workspace-service/package*.json ./services/workspace-service/

RUN npm ci --silent

COPY services/shared/ ./services/shared/
COPY services/workspace-service/ ./services/workspace-service/

RUN npm run build -w @microservices/shared
RUN npm run build -w workspace-service

FROM node:22-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/services/shared/package*.json ./services/shared/
COPY --from=builder /usr/src/app/services/workspace-service/package*.json ./services/workspace-service/

RUN npm ci --omit=dev --silent

COPY --from=builder /usr/src/app/services/shared/dist ./services/shared/dist
COPY --from=builder /usr/src/app/services/workspace-service/dist ./services/workspace-service/dist

EXPOSE 8000

CMD ["npm", "run", "start", "-w", "services/workspace-service"]
