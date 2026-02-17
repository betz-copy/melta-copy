FROM node:22-alpine AS builder
WORKDIR /usr/src/app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package*.json ./

RUN pnpm install --silent

COPY ./ ./

CMD ["node", "src/renamePermissionsUserIdToRelatedId.js"]