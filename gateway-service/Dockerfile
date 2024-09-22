FROM node:22-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
COPY .npmrc ./

RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    npm install --silent --progress=false

COPY . .

RUN npm run build

RUN rm -f .npmrc

FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY .npmrc ./

RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    npm install --omit=dev --silent --progress=false

RUN rm -f .npmrc

COPY --from=build /usr/src/app/dist ./dist

EXPOSE 8000

CMD ["npm", "run", "start"]
