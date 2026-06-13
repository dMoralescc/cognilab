FROM node:22-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

RUN pnpm install --frozen-lockfile

# Remove any cached Prisma engine binaries to force a clean prisma generate
RUN find /app/node_modules -path "*/.prisma/client/libquery_engine-*" -delete 2>/dev/null || true

COPY packages/tsconfig ./packages/tsconfig/
COPY packages/shared ./packages/shared/
COPY apps/api ./apps/api/

RUN pnpm --filter @cognilab/api exec prisma generate
RUN pnpm --filter @cognilab/shared build
RUN pnpm --filter @cognilab/api build

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
