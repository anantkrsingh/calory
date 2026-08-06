# Use official Node.js image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy built files and dependencies
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=base /app/dist ./dist
COPY --from=base /app/.env ./

# Install production dependencies only
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --prod --frozen-lockfile

# Set non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Start the worker
CMD ["node", "dist/main"]
