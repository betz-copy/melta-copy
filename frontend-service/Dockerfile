
FROM node:22-alpine AS build
WORKDIR /usr/src/app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy root workspace files
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY turbo.json ./
COPY pnpm-workspace.yaml ./

# Copy packages (contains package.json files needed for pnpm workspace resolution)
COPY packages ./packages

# Copy frontend files
COPY frontend-service/package*.json ./frontend-service/
COPY frontend-service ./frontend-service/

# Install dependencies (pnpm will resolve workspace packages from package.json files in packages/)
RUN pnpm install --frozen-lockfile --silent

# Build using Turborepo (only builds frontend-service and its dependencies)
RUN NODE_OPTIONS=--max-old-space-size=8000 pnpm turbo build --filter=frontend-service


FROM nginx:alpine

COPY --from=build /usr/src/app/frontend-service/dist /usr/share/nginx/html
COPY frontend-service/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8000
