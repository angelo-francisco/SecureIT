FROM ghcr.io/pnpm/pnpm:11

RUN pnpm runtime set node 22 -g

ARG UID=1000
ARG GID=1000
RUN groupadd -g $GID appgroup && useradd -u $UID -g appgroup -m appuser

WORKDIR /app

COPY package.json pnpm-*.yaml ./

RUN pnpm install

COPY . .

USER appuser

EXPOSE 3000

CMD ["sh", "-c", "pnpm prisma generate && pnpm dev"]
