FROM node:22-alpine AS builder
WORKDIR /usr/src/app

RUN apk add --no-cache \
    libreoffice \
    ffmpeg \
    msttcorefonts-installer \
    openjdk11 \
    && update-ms-fonts \
    && fc-cache -f \
    && rm -rf /var/cache/apk/*

COPY package*.json ./
COPY tsconfig.json ./
COPY services/shared/package*.json ./services/shared/
COPY services/preview-service/package*.json ./services/preview-service/

RUN npm ci --silent

COPY services/shared/ ./services/shared/
COPY services/preview-service ./services/preview-service/

RUN npm run build -w @microservices/shared
RUN npm run build -w preview-service

FROM node:22-alpine
WORKDIR /usr/src/app

RUN apk add --no-cache libreoffice ffmpeg msttcorefonts-installer openjdk11 \
    && update-ms-fonts \
    && fc-cache -f \
    && rm -rf /var/cache/apk/*

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/services/shared/package*.json ./services/shared/
COPY --from=builder /usr/src/app/services/preview-service/package*.json ./services/preview-service/

RUN npm ci --omit=dev --silent

COPY --from=builder /usr/src/app/services/shared/dist ./services/shared/dist
COPY --from=builder /usr/src/app/services/preview-service/dist ./services/preview-service/dist

EXPOSE 8000

CMD ["npm", "run", "start", "-w", "services/preview-service"]
