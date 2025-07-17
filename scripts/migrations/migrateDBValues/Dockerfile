FROM node:22-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --silent

COPY ./ ./

CMD ["node", "src/renamePermissionsUserIdToRelatedId.js"]