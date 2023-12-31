FROM node:18.14-alpine

WORKDIR /usr/src/app

RUN apk add libreoffice ffmpeg
RUN apk add msttcorefonts-installer && update-ms-fonts && fc-cache -f
RUN apk add --update openjdk11


COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production=false --silent
# --production (in npm install) shouldnt be because need to run build typescript
COPY . .

RUN npm run build

CMD npm run start 