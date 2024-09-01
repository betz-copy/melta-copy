FROM node:22-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --silent

COPY . .

RUN npm run build


FROM node:22-alpine
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --omit=dev --silent
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 8000

CMD ["npm", "run", "start"]