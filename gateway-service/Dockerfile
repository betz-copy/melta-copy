FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY turbo.json ./
COPY pnpm-workspace.yaml ./

# Copy packages (contains package.json files needed for pnpm workspace resolution)
COPY packages ./packages

COPY gateway-service/package*.json ./gateway-service/
COPY gateway-service/.npmrc ./gateway-service/.npmrc
COPY .npmrc ./

RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    pnpm install --frozen-lockfile --silent
COPY gateway-service ./gateway-service

RUN --mount=type=cache,target=/usr/src/app/.turbo \
    pnpm turbo build --filter=gateway-service

RUN rm -f .npmrc

FROM node:22-alpine

WORKDIR /usr/src/app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY gateway-service/package*.json ./gateway-service/
COPY gateway-service/.npmrc ./gateway-service/.npmrc
COPY .npmrc ./

# Copy packages structure temporarily to extract only built packages
COPY --from=builder /usr/src/app/packages ./packages-temp

# Copy extract packages script
COPY scripts/docker/extract-packages.sh ./extract-packages.sh
RUN chmod +x ./extract-packages.sh

# Extract only package.json and dist from packages that were built (have dist folder)
RUN ./extract-packages.sh

# Install only production dependencies (install deps, then add the built app)
RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    pnpm install --frozen-lockfile --prod --silent
RUN rm -f .npmrc

# Copy flatten script and service dist, then flatten
COPY scripts/docker/flatten-dist.sh ./flatten-dist.sh
RUN chmod +x ./flatten-dist.sh
COPY --from=builder /usr/src/app/gateway-service/dist ./gateway-service/dist-temp
RUN ./flatten-dist.sh gateway-service

# Entrypoint: always run with node
COPY scripts/docker/run-service.sh ./scripts/docker/run-service.sh
RUN chmod +x ./scripts/docker/run-service.sh
ENV SERVICE_NAME=gateway-service
ENTRYPOINT ["./scripts/docker/run-service.sh"]

EXPOSE 8000

RUN echo "Finish building: gateway-service image"
