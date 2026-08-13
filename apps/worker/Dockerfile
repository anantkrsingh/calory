# Monorepo build for @fitness/worker — build context must be the repo root.
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/admin/package.json ./apps/admin/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/ai/package.json ./packages/ai/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
ENV MONGODB_URI=mongodb://127.0.0.1:27017/build
# Full workspace install for packages present in the build context (mobile/admin are dockerignored).
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY packages ./packages
COPY apps/worker ./apps/worker
ENV MONGODB_URI=mongodb://127.0.0.1:27017/build
RUN pnpm exec turbo run build --filter=@fitness/worker...

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=builder --chown=nestjs:nodejs /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/worker/package.json ./apps/worker/
COPY --from=builder --chown=nestjs:nodejs /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages

USER nestjs

CMD ["node", "apps/worker/dist/main.js"]
