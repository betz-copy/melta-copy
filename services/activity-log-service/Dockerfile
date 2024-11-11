FROM node:22-alpine AS build
WORKDIR /usr/src/app

COPY ./services/activity-log-service/package*.json ./

RUN npm ci --silent

COPY ./services/activity-log-service .

RUN npm run build


FROM node:22-alpine
WORKDIR /usr/src/app

COPY ./services/activity-log-service/package*.json ./

RUN npm ci --omit=dev --silent
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 8000

CMD ["npm", "run", "start"]