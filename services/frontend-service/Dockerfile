
FROM node:22-alpine as builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY services/shared/package.json ./services/shared/
COPY services/frontend-service/package*.json ./services/frontend-service/

RUN npm ci --silent

COPY services/shared/ ./services/shared/
COPY services/frontend-service ./services/frontend-service/

RUN npm run build -w @microservices/shared
RUN NODE_OPTIONS=--max-old-space-size=8000 npm run build -w frontend-service --prod

FROM nginx:alpine

COPY --from=builder /usr/src/app/services/shared/dist ./services/shared/dist
COPY --from=builder /usr/src/app/services/frontend-service/dist /usr/share/nginx/html
COPY services/frontend-service/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8000
