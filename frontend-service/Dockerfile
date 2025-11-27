
FROM node:22-alpine AS build
WORKDIR /usr/src/app

# Copy root workspace files
COPY package*.json ./
COPY tsconfig.json ./
COPY turbo.json ./

# Copy shared package
COPY shared/ ./shared/

# Copy frontend files
COPY frontend-service/ ./frontend-service/

# Install dependencies
RUN npm ci --silent

# Build using Turborepo (automatically builds shared first)
RUN NODE_OPTIONS=--max-old-space-size=8000 npx turbo build --filter=frontend-service


FROM nginx:alpine

COPY --from=build /usr/src/app/frontend-service/dist /usr/share/nginx/html
COPY frontend-service/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8000
