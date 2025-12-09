# Multi-stage build for API Gateway
FROM node:18-alpine AS builder

WORKDIR /app

# Copy shared package first (dependency)
COPY shared/package.json shared/tsconfig.json ./shared/
COPY shared/src ./shared/src
COPY shared/index.ts ./shared/

# Build shared package
WORKDIR /app/shared
RUN npm ci && npm run build

# Copy service files
WORKDIR /app
COPY api-gateway/package*.json ./api-gateway/
COPY api-gateway/tsconfig.json ./api-gateway/
COPY api-gateway/nest-cli.json ./api-gateway/
COPY api-gateway/src ./api-gateway/src

# Install dependencies and build
WORKDIR /app/api-gateway
RUN npm ci && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY api-gateway/package*.json ./
RUN npm ci --production && npm cache clean --force

# Copy built files
COPY --from=builder /app/api-gateway/dist ./dist
COPY --from=builder /app/shared/dist ./node_modules/@care-monitoring/shared/dist
COPY --from=builder /app/shared/package.json ./node_modules/@care-monitoring/shared/
COPY --from=builder /app/shared/index.ts ./node_modules/@care-monitoring/shared/

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]


WORKDIR /app

# Install production dependencies only
COPY api-gateway/package*.json ./
RUN npm ci --production && npm cache clean --force

# Copy built files
COPY --from=builder /app/api-gateway/dist ./dist
COPY --from=builder /app/shared/dist ./node_modules/@care-monitoring/shared/dist
COPY --from=builder /app/shared/package.json ./node_modules/@care-monitoring/shared/
COPY --from=builder /app/shared/index.ts ./node_modules/@care-monitoring/shared/

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]


WORKDIR /app

# Install production dependencies only
COPY api-gateway/package*.json ./
RUN npm ci --production && npm cache clean --force

# Copy built files
COPY --from=builder /app/api-gateway/dist ./dist
COPY --from=builder /app/shared/dist ./node_modules/@care-monitoring/shared/dist
COPY --from=builder /app/shared/package.json ./node_modules/@care-monitoring/shared/
COPY --from=builder /app/shared/index.ts ./node_modules/@care-monitoring/shared/

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]

