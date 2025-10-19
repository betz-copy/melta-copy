FROM node:22-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY shared/package*.json ./shared/
COPY rule-breach-service/package*.json ./rule-breach-service/

RUN npm ci --silent

COPY shared/ ./shared/
COPY rule-breach-service ./rule-breach-service/

RUN npm run build -w @microservices/shared
RUN npm run build -w rule-breach-service

FROM node:22-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/shared/package*.json ./shared/
COPY --from=builder /usr/src/app/rule-breach-service/package*.json ./rule-breach-service/

RUN npm ci --omit=dev --silent

COPY --from=builder /usr/src/app/shared/dist ./shared/dist
COPY --from=builder /usr/src/app/rule-breach-service/dist ./rule-breach-service/dist

EXPOSE 8000

CMD ["npm", "run", "start", "-w", "rule-breach-service"]