
FROM node:22-alpine as builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY shared-interfaces/package.json ./shared-interfaces/
COPY frontend-service/package*.json ./frontend-service/

RUN npm ci --silent

COPY shared-interfaces/ ./shared-interfaces/
COPY frontend-service ./frontend-service/

RUN npm run build -w @microservices/shared-interfaces
RUN NODE_OPTIONS=--max-old-space-size=8000 npm run build -w frontend-service --prod

FROM nginx:alpine

COPY --from=builder /usr/src/app/shared-interfaces/dist ./shared-interfaces/dist
COPY --from=builder /usr/src/app/frontend-service/dist /usr/share/nginx/html
COPY frontend-service/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8000
