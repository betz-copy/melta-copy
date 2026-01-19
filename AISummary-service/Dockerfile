FROM node:22-alpine AS builder
WORKDIR /usr/src/app

# Copy root files
COPY package*.json ./
COPY tsconfig.json ./

# Copy shared
COPY shared/package*.json ./shared/
COPY shared/ ./shared/

# Copy AISummary-service
COPY AISummary-service/package*.json ./AISummary-service/
COPY AISummary-service/ ./AISummary-service/

# Install dependencies & build 'shared' first, then AISummary-service
RUN npm install
RUN npm run build -w @microservices/shared
RUN npm run build -w AISummary-service

# ---------------------------
# Production stage
FROM node:22-alpine
WORKDIR /usr/src/app

# Copy final output
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/shared/package*.json ./shared/
COPY --from=builder /usr/src/app/AISummary-service/package*.json ./AISummary-service/

# Install only production dependencies
RUN npm ci --omit=dev --silent

COPY --from=builder /usr/src/app/shared/dist ./shared/dist
COPY --from=builder /usr/src/app/AISummary-service/dist ./AISummary-service/dist

EXPOSE 8000

RUN echo "Finish building: AISummary-service image"
