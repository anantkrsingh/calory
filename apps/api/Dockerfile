# Monorepo build for @fitness/api — build context must be the repo root.
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/admin/package.json ./apps/admin/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/ai/package.json ./packages/ai/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
# Prisma generate needs a URI present; runtime URI comes from compose/env.
ENV MONGODB_URI=mongodb://127.0.0.1:27017/build
# Only fetch/link deps for @fitness/api and its workspace dependencies — the
# rest of the monorepo (mobile/admin/worker) is 1000+ unrelated packages we
# don't need to build or run this image. --frozen-lockfile still validates
# against the full lockfile, so this stays safe against a stale lockfile.
# The cache mount persists the pnpm content-addressable store across builds.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --filter=@fitness/api... --frozen-lockfile

FROM deps AS builder
COPY packages ./packages
COPY apps/api ./apps/api
ENV MONGODB_URI=mongodb://127.0.0.1:27017/build
RUN --mount=type=cache,id=turbo-api,target=/app/.turbo \
    pnpm exec turbo run build --filter=@fitness/api...

FROM base AS runner

ENV NODE_ENV=production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=nestjs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=nestjs:nodejs /app/.npmrc ./.npmrc

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
# apps/api's own node_modules holds the symlinks (@nestjs/common, @nestjs/core,
# ...) that resolve into the pnpm store — without it, main.js can't find them.
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist

COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages

USER nestjs

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
