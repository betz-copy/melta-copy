FROM node:13.12-alpine

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production=false --silent
# --production (in npm install) shouldnt be because need to run build typescript
COPY . .

CMD npm run dev 