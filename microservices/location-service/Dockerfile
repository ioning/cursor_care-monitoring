# Multi-stage build for Location Service
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
COPY microservices/location-service/package*.json ./microservices/location-service/
COPY microservices/location-service/tsconfig.json ./microservices/location-service/
COPY microservices/location-service/nest-cli.json ./microservices/location-service/
COPY microservices/location-service/src ./microservices/location-service/src

# Install dependencies and build
WORKDIR /app/microservices/location-service
RUN npm install && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy dependencies from builder (more reliable for local debugging than reinstalling in a minimal stage)
# Includes shared runtime deps that are required by compiled output under /app/dist/shared/...
COPY --from=builder /app/microservices/location-service/node_modules ./node_modules
COPY --from=builder /app/shared/node_modules ./node_modules
COPY --from=builder /app/shared/node_modules /shared/node_modules

# Copy built files
COPY --from=builder /app/microservices/location-service/dist ./dist
COPY --from=builder /app/shared/dist ./node_modules/@care-monitoring/shared/dist
COPY --from=builder /app/shared/package.json ./node_modules/@care-monitoring/shared/
COPY --from=builder /app/shared/index.ts ./node_modules/@care-monitoring/shared/

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "const req=require('http').get('http://127.0.0.1:3006/locations/health/ready',(r)=>{process.exit(r.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.setTimeout(2500,()=>{req.destroy();process.exit(1)})"

CMD ["node", "dist/microservices/location-service/src/main.js"]
