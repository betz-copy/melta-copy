FROM node:22-alpine AS builder
RUN apk add --no-cache antiword
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

COPY semantic-service/package*.json ./semantic-service/

RUN pnpm install --frozen-lockfile --silent
COPY semantic-service ./semantic-service

RUN pnpm turbo build --filter=semantic-service

FROM node:22-alpine
RUN apk add --no-cache antiword
WORKDIR /usr/src/app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/pnpm-lock.yaml ./
COPY --from=builder /usr/src/app/pnpm-workspace.yaml ./
COPY --from=builder /usr/src/app/semantic-service/package*.json ./semantic-service/

# Copy packages structure temporarily to extract only built packages
COPY --from=builder /usr/src/app/packages ./packages-temp

# Copy extract packages script
COPY scripts/docker/extract-packages.sh ./extract-packages.sh
RUN chmod +x ./extract-packages.sh

# Extract only package.json and dist from packages that were built (have dist folder)
RUN ./extract-packages.sh

RUN pnpm install --frozen-lockfile --prod --silent

# Copy flatten script
COPY scripts/docker/flatten-dist.sh ./flatten-dist.sh
RUN chmod +x ./flatten-dist.sh

# Copy service dist and handle nested structure if needed
COPY --from=builder /usr/src/app/semantic-service/dist ./semantic-service/dist-temp

RUN ./flatten-dist.sh semantic-service

EXPOSE 8000

CMD ["pnpm", "--filter", "semantic-service", "start"]

RUN echo "Finish building: semantic-service image"