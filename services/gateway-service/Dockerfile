FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY services/shared-interfaces/package*.json ./services/shared-interfaces/
COPY services/shared/package*.json ./services/shared/
COPY services/gateway-service/package*.json ./services/gateway-service/
COPY services/gateway-service/.npmrc ./services/gateway-service/.npmrc
COPY .npmrc ./

RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    npm ci --silent --progress=false

COPY services/shared-interfaces/ ./services/shared-interfaces/  
COPY services/shared/ ./services/shared/
COPY services/gateway-service ./services/gateway-service

RUN npm run build -w @microservices/shared-interfaces
RUN npm run build -w @microservices/shared
RUN npm run build -w gateway-service

RUN rm -f .npmrc

FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY services/shared-interfaces/package*.json ./services/shared-interfaces/
COPY services/shared/package*.json ./services/shared/
COPY services/gateway-service/package*.json ./services/gateway-service/
COPY services/gateway-service/.npmrc ./services/gateway-service/.npmrc
COPY .npmrc ./

RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    npm ci --omit=dev --progress=false

RUN rm -f .npmrc

COPY --from=builder /usr/src/app/services/shared-interfaces/dist ./services/shared-interfaces/dist
COPY --from=builder /usr/src/app/services/shared/dist ./services/shared/dist
COPY --from=builder /usr/src/app/services/gateway-service/dist ./services/gateway-service/dist

EXPOSE 8000

CMD ["npm", "run", "start", "-w", "services/gateway-service"]
