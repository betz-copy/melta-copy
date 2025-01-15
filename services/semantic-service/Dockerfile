FROM node:22-alpine AS builder
RUN apk add --no-cache antiword
WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY services/shared-interfaces/package*.json ./services/shared-interfaces/
COPY services/shared/package*.json ./services/shared/
COPY services/semantic-service/package*.json ./services/semantic-service/

RUN npm ci --silent

COPY services/shared-interfaces/ ./services/shared-interfaces/
COPY services/shared/ ./services/shared/
COPY services/semantic-service ./services/semantic-service/

RUN npm run build -w @microservices/shared-interfaces
RUN npm run build -w @microservices/shared
RUN npm run build -w semantic-service

FROM node:22-alpine
RUN apk add --no-cache antiword
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/services/shared-interfaces/package*.json ./services/shared-interfaces/
COPY --from=builder /usr/src/app/services/shared/package*.json ./services/shared/
COPY --from=builder /usr/src/app/services/semantic-service/package*.json ./services/semantic-service/

RUN npm ci --omit=dev --silent

COPY --from=builder /usr/src/app/services/shared-interfaces/dist ./services/shared-interfaces/dist
COPY --from=builder /usr/src/app/services/shared/dist ./services/shared/dist
COPY --from=builder /usr/src/app/services/semantic-service/dist ./services/semantic-service/dist

EXPOSE 8000

CMD ["npm", "run", "start", "-w", "services/semantic-service"]