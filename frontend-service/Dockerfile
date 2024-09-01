
FROM node:22-alpine as build
WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json", ".npmrc", "./"]
RUN npm install --silent

COPY . .

RUN NODE_OPTIONS=--max-old-space-size=8000 npm run build --prod


FROM nginx:alpine

COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8000
