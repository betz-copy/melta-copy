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

# Copy root files
COPY ./package*.json ./
COPY ./tsconfig.json ./

# Copy shared
COPY ../shared/package*.json ./shared/
COPY ../shared/ ./shared/

COPY ./preview-service/package*.json ./preview-service/
COPY ./preview-service ./preview-service/

# Install dependencies & build 'shared'
RUN npm ci --silent
RUN npm run build -w @microservices/shared
RUN npm run build -w preview-service

# ---------------------------
# Production stage
FROM node:22-alpine
WORKDIR /usr/src/app

RUN apk add --no-cache libreoffice ffmpeg msttcorefonts-installer openjdk11 \
    && update-ms-fonts \
    && fc-cache -f \
    && rm -rf /var/cache/apk/*

# Copy final output
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/shared/package*.json ./shared/
COPY --from=builder /usr/src/app/preview-service/package*.json ./preview-service/

# Install only production dependencies
RUN npm ci --omit=dev --silent

COPY --from=builder /usr/src/app/shared/dist ./shared/dist
COPY --from=builder /usr/src/app/preview-service/dist ./preview-service/dist

EXPOSE 8000

RUN echo "Finish building: preview-service image"