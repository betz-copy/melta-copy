FROM node:22-alpine

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production=false --silent
COPY . .

RUN npm run build

CMD npm run start

EXPOSE 8000

# FROM node:22-alpine AS build
# WORKDIR /usr/src/app

# COPY ["package.json", "package-lock.json*", "./"]
# RUN npm install --production=false --silent

# COPY . .

# RUN npm run build


# FROM node:22-alpine
# WORKDIR /usr/src/app

# COPY --from=build /usr/src/app .

# EXPOSE 8000
# CMD ["npm", "run", "start"]