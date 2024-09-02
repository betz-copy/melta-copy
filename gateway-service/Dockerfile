FROM node:18.14-alpine

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production=false --silent
COPY . .

RUN npm run build

RUN apk add --no-cache bash curl && apk add --no-cache --virtual .build-deps gcc g++ make \
    && apk add --no-cache --virtual .persistent-deps python3 \
    && npm install -g cron && apk del .build-deps

COPY ./src/utils/notifications/dateNotificationsCheck.ts /usr/src/app/src/utils/notifications/dateNotificationsCheck.ts

RUN echo "0 0 * * * node /usr/src/app/src/utils/notifications/dateNotificationsCheck.ts >> /var/log/cron.log 2>&1" > /etc/crontabs/root

CMD crond && npm run start

EXPOSE 8000
