FROM ghcr.io/pnpm/pnpm:11

RUN pnpm runtime set node 22 -g

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]
