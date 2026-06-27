FROM ghcr.io/pnpm/pnpm:11

RUN pnpm runtime set node 22 -g

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 1420

EXPOSE 1421

ENV TAURI_DEV_HOST=0.0.0.0

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
