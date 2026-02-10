FROM node:22-alpine AS build
WORKDIR /usr/src/app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package*.json ./

RUN pnpm install --frozen-lockfile --silent

COPY . .

RUN pnpm build


FROM node:22-alpine
WORKDIR /usr/src/app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package*.json ./

RUN pnpm install --frozen-lockfile --prod --silent
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 8000

CMD ["pnpm", "start"]