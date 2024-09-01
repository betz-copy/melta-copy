FROM node:22-alpine AS build
WORKDIR /usr/src/app

RUN apk add --no-cache \
    libreoffice \
    ffmpeg \
    msttcorefonts-installer \
    openjdk11 \
    && update-ms-fonts \
    && fc-cache -f

COPY package*.json npm-shrinkwrap.json* ./
RUN npm install --silent
# --production (in npm install) shouldnt be because need to run build typescript

COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --omit=dev --silent
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 8000
CMD ["npm", "run", "start"]

