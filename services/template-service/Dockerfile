FROM node:22-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY services/template-service/package*.json ./services/template-service/

RUN npm ci --silent

COPY packages/shared/ ./packages/shared/
COPY services/template-service/ ./services/template-service/

RUN npm run build -w @microservices/shared
RUN npm run build -w template-service


FROM node:22-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/packages/shared/package*.json ./packages/shared/
COPY --from=builder /usr/src/app/services/template-service/package*.json ./services/template-service/
COPY --from=builder /usr/src/app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /usr/src/app/services/template-service/dist ./services/template-service/dist


RUN npm ci --omit=dev --silent

EXPOSE 8000

CMD ["node", "--async-stack-traces", "services/template-service/dist/index.js"]