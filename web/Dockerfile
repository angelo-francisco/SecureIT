FROM node:22-slim

ENV PNPM_HOME="/pnpm"

ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-*.yaml ./

COPY prisma ./prisma/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

COPY . .

RUN pnpm prisma generate

EXPOSE 3000

CMD [pnpm dev"]
