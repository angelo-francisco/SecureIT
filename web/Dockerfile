FROM ghcr.io/pnpm/pnpm:11

RUN pnpm runtime set node 22 -g

WORKDIR /app

COPY package.json pnpm-*.yaml ./

RUN pnpm install

COPY . .

RUN pnpm prisma generate

EXPOSE 3000

CMD ["sh", "-c", "pnpm prisma db push && pnpm dev"]
