FROM node:22-alpine AS build
RUN apk add --no-cache antiword
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --silent

COPY . .

RUN npm run build


FROM node:22-alpine
RUN apk add --no-cache antiword
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev --silent
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 8000

CMD ["npm", "run", "start"]