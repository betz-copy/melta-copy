FROM node:22-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package*.json ./

RUN pnpm install --silent

COPY . .

EXPOSE 8000

CMD ["pnpm", "start"]
