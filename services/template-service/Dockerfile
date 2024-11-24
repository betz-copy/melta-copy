FROM node:22-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY services/shared/package*.json ./services/shared/
COPY services/template-service/package*.json ./services/template-service/

RUN npm ci --silent

COPY services/shared/ ./services/shared/
COPY services/template-service/ ./services/template-service/

RUN npm run build -w @microservices/shared
RUN npm run build -w template-service

FROM node:22-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/services/shared/package*.json ./services/shared/
COPY --from=builder /usr/src/app/services/template-service/package*.json ./services/template-service/

RUN npm ci --omit=dev --silent

COPY --from=builder /usr/src/app/services/shared/dist ./services/shared/dist
COPY --from=builder /usr/src/app/services/template-service/dist ./services/template-service/dist

EXPOSE 8000

CMD ["npm", "run", "start", "-w", "services/template-service"]