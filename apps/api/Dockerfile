FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @cognilab/api exec prisma generate

COPY packages/tsconfig ./packages/tsconfig/
COPY packages/shared ./packages/shared/
COPY apps/api ./apps/api/

RUN pnpm --filter @cognilab/shared build
RUN pnpm --filter @cognilab/api build

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/main"]
