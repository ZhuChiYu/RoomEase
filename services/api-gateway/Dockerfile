# Multi-stage build for NestJS API Gateway
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY services/api-gateway ./services/api-gateway

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build packages
WORKDIR /app/packages/database
RUN pnpm prisma generate
RUN pnpm build

WORKDIR /app/packages/shared
RUN pnpm build

# Build API Gateway
WORKDIR /app/services/api-gateway
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install openssl (needed for Prisma)
RUN apk add --no-cache openssl

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json ./

# Copy packages with their node_modules and built files
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared

# Copy API Gateway
COPY --from=builder /app/services/api-gateway/package.json ./services/api-gateway/
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist
COPY --from=builder /app/services/api-gateway/node_modules ./services/api-gateway/node_modules

# Set working directory to API Gateway
WORKDIR /app/services/api-gateway

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main.js"]

