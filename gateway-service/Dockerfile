FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY turbo.json ./
COPY shared/package*.json ./shared/
COPY gateway-service/package*.json ./gateway-service/
COPY gateway-service/.npmrc ./gateway-service/.npmrc
COPY .npmrc ./

RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    npm ci --silent --progress=false

COPY shared/ ./shared/
COPY gateway-service ./gateway-service

RUN npx turbo build --filter=gateway-service

RUN rm -f .npmrc

FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY shared/package*.json ./shared/
COPY gateway-service/package*.json ./gateway-service/
COPY gateway-service/.npmrc ./gateway-service/.npmrc
COPY .npmrc ./

RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    npm ci --omit=dev --progress=false

RUN rm -f .npmrc

COPY --from=builder /usr/src/app/shared/dist ./shared/dist
COPY --from=builder /usr/src/app/gateway-service/dist ./gateway-service/dist

EXPOSE 8000

CMD ["npx", "turbo", "start", "--filter=gateway-service"]
