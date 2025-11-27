FROM node:22-alpine AS builder
RUN apk add --no-cache antiword
WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY turbo.json ./
COPY shared/package*.json ./shared/
COPY semantic-service/package*.json ./semantic-service/

RUN npm ci --silent

COPY shared/ ./shared/
COPY semantic-service ./semantic-service/

RUN npx turbo build --filter=semantic-service

FROM node:22-alpine
RUN apk add --no-cache antiword
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/shared/package*.json ./shared/
COPY --from=builder /usr/src/app/semantic-service/package*.json ./semantic-service/

RUN npm ci --omit=dev --silent

COPY --from=builder /usr/src/app/shared/dist ./shared/dist
COPY --from=builder /usr/src/app/semantic-service/dist ./semantic-service/dist

EXPOSE 8000

CMD ["npx", "turbo", "start", "--filter=semantic-service"]