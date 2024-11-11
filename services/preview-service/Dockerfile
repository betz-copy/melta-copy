# Build stage
FROM node:22-alpine AS build


WORKDIR /usr/src/app
RUN apk add --no-cache \
    libreoffice \
    ffmpeg \
    msttcorefonts-installer \
    openjdk11 \
    && update-ms-fonts \
    && fc-cache -f \
    && rm -rf /var/cache/apk/*

COPY ["./services/preview-service/package.json", "./services/preview-service/package-lock.json*", "./services/preview-service/npm-shrinkwrap.json*", "./"]
RUN npm ci --silent

COPY ./services/preview-service .

RUN npm run build

# Runtime stage
FROM node:22-alpine

WORKDIR /usr/src/app
RUN apk add --no-cache libreoffice ffmpeg msttcorefonts-installer openjdk11 \
    && update-ms-fonts \
    && fc-cache -f \
    && rm -rf /var/cache/apk/*

COPY --from=build /usr/src/app .

EXPOSE 8000

CMD ["npm", "run", "start"]
