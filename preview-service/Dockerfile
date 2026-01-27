FROM node:22-alpine AS builder
WORKDIR /usr/src/app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

RUN apk add --no-cache \
    libreoffice \
    ffmpeg \
    msttcorefonts-installer \
    openjdk11 \
    && update-ms-fonts \
    && fc-cache -f \
    && rm -rf /var/cache/apk/*

# Copy root files
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY turbo.json ./
COPY pnpm-workspace.yaml ./

# Copy packages (contains package.json files needed for pnpm workspace resolution)
COPY packages ./packages

# Copy service package.json and source
COPY preview-service/package*.json ./preview-service/
COPY preview-service ./preview-service/

# Install dependencies (pnpm will resolve workspace packages from package.json files in packages/)
RUN pnpm install --frozen-lockfile --silent

# Build using Turborepo (only builds preview-service and its dependencies)
RUN --mount=type=cache,target=/usr/src/app/.turbo \
    pnpm turbo build --filter=preview-service

# ---------------------------
# Production stage
FROM node:22-alpine
WORKDIR /usr/src/app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

RUN apk add --no-cache libreoffice ffmpeg msttcorefonts-installer openjdk11 \
    && update-ms-fonts \
    && fc-cache -f \
    && rm -rf /var/cache/apk/*

# Copy package.json files (needed for pnpm workspace resolution)
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/pnpm-lock.yaml ./
COPY --from=builder /usr/src/app/pnpm-workspace.yaml ./
COPY --from=builder /usr/src/app/preview-service/package*.json ./preview-service/

# Copy packages structure temporarily to extract only built packages
COPY --from=builder /usr/src/app/packages ./packages-temp

# Copy extract packages script
COPY scripts/docker/extract-packages.sh ./extract-packages.sh
RUN chmod +x ./extract-packages.sh

# Extract only package.json and dist from packages that were built (have dist folder)
# Turborepo only builds dependencies, so only those will have dist folders
RUN ./extract-packages.sh

# Install only production dependencies
# pnpm will link workspace packages based on package.json files
RUN pnpm install --frozen-lockfile --prod --silent

# Copy flatten script
COPY scripts/docker/flatten-dist.sh ./flatten-dist.sh
RUN chmod +x ./flatten-dist.sh

# Copy service dist and handle nested structure if needed
COPY --from=builder /usr/src/app/preview-service/dist ./preview-service/dist-temp

RUN ./flatten-dist.sh preview-service

EXPOSE 8000

RUN echo "Finish building: preview-service image"