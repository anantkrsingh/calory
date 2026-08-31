# Monorepo build for @fitness/admin — build context must be the repo root.
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
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
# Prisma generate needs a URI present; runtime URI comes from compose/env.
ENV MONGODB_URI=mongodb://127.0.0.1:27017/build
# Only fetch/link deps for @fitness/admin and its workspace dependencies —
# the rest of the monorepo (mobile/api/worker) isn't needed for this image.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --filter=@fitness/admin... --frozen-lockfile

FROM deps AS builder
COPY packages ./packages
COPY apps/admin ./apps/admin
ENV MONGODB_URI=mongodb://127.0.0.1:27017/build
RUN --mount=type=cache,id=turbo-admin,target=/app/.turbo \
    pnpm exec turbo run build --filter=@fitness/admin...

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/package.json ./apps/admin/
# apps/admin's own node_modules holds the symlink to `next` itself (the CMD
# below runs it directly) plus admin's other direct deps — without this copy
# they resolve into the pnpm store which was never present at the root.
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/node_modules ./apps/admin/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/next.config.ts ./apps/admin/
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages

USER nextjs
WORKDIR /app/apps/admin
EXPOSE 3002

# package.json's "start" script hardcodes -p 3001, so invoke next directly to bind 3002.
# `next` itself only exists as a symlink under apps/admin/node_modules (see above),
# not hoisted to the root node_modules, so it must be referenced from there.
CMD ["node", "/app/apps/admin/node_modules/next/dist/bin/next", "start", "-p", "3002"]
