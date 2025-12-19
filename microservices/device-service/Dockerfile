# Multi-stage build for Device Service
FROM node:18-alpine AS builder

WORKDIR /app

# Copy shared package first (dependency) for better caching
COPY shared/package*.json shared/tsconfig.json shared/index.ts ./shared/
COPY shared/libs ./shared/libs
COPY shared/guards ./shared/guards
COPY shared/middleware ./shared/middleware
COPY shared/types ./shared/types
COPY shared/controllers ./shared/controllers
COPY shared/modules ./shared/modules
COPY shared/test-utils ./shared/test-utils

# Build shared package
WORKDIR /app/shared
RUN npm install && npm run build

# Copy service files
WORKDIR /app
COPY microservices/device-service/package*.json ./microservices/device-service/
COPY microservices/device-service/tsconfig.json ./microservices/device-service/
COPY microservices/device-service/nest-cli.json ./microservices/device-service/
COPY microservices/device-service/src ./microservices/device-service/src

# Install dependencies and build
WORKDIR /app/microservices/device-service
RUN npm install && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy dependencies from builder (more reliable than reinstalling with local file deps)
COPY --from=builder /app/microservices/device-service/node_modules ./node_modules

# Copy built files
COPY --from=builder /app/microservices/device-service/dist ./dist
COPY --from=builder /app/shared/node_modules ./node_modules
COPY --from=builder /app/shared/node_modules /shared/node_modules
COPY --from=builder /app/shared/dist /shared/dist
COPY --from=builder /app/shared/package.json /shared/package.json
COPY --from=builder /app/shared/index.ts /shared/index.ts

# Ensure "@care-monitoring/shared" resolves inside the container (and points to /shared)
RUN rm -rf ./node_modules/@care-monitoring/shared && \
    mkdir -p ./node_modules/@care-monitoring && \
    ln -s /shared ./node_modules/@care-monitoring/shared

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/devices/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/microservices/device-service/src/main.js"]
