FROM node:22-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY services/rule-breach-service/package*.json ./services/rule-breach-service/

RUN npm ci --silent

COPY packages/shared/ ./packages/shared/
COPY services/rule-breach-service ./services/rule-breach-service/

RUN npm run build -w @microservices/shared
RUN npm run build -w rule-breach-service

FROM node:22-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/packages/shared/package*.json ./packages/shared/
COPY --from=builder /usr/src/app/services/rule-breach-service/package*.json ./services/rule-breach-service/

RUN npm ci --omit=dev --silent

COPY --from=builder /usr/src/app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /usr/src/app/services/rule-breach-service/dist ./services/rule-breach-service/dist

EXPOSE 8000

CMD ["npm", "run", "start", "-w", "services/rule-breach-service"]