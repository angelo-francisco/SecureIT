FROM ghcr.io/pnpm/pnpm:11

RUN pnpm runtime set node 22 -g

WORKDIR /app

COPY package.json pnpm-*.yaml prisma/ ./

RUN pnpm install

COPY . .

EXPOSE 3000


CMD ["sh", "-c", "pnpm prisma generate && pnpm dev"]
