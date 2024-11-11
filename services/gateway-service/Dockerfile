FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY services/gateway-service/package*.json ./services/gateway-service/
COPY services/gateway-service/.npmrc ./services/gateway-service/.npmrc
COPY .npmrc ./

RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    npm ci --progress=false

COPY packages/shared/ ./packages/shared/
COPY services/gateway-service ./services/gateway-service

RUN npm run build -w @microservices/shared
RUN npm run build -w gateway-service

RUN rm -f .npmrc

FROM node:22-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/packages/shared/package*.json ./packages/shared/
COPY --from=builder /usr/src/app/services/gateway-service/package*.json ./services/gateway-service/
COPY --from=builder /usr/src/app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /usr/src/app/services/gateway-service/dist ./services/gateway-service/dist
COPY --from=builder /usr/src/app/services/gateway-service/.npmrc ./services/gateway-service/.npmrc

RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    npm ci --omit=dev --silent --progress=false

RUN rm -f .npmrc

EXPOSE 8000

CMD ["npm", "run", "start"]
