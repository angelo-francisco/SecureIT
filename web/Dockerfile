FROM oven/bun:1.1 AS base
WORKDIR /app

COPY package.json bun.lockb* ./

COPY prisma/ ./prisma

RUN bun install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

ENV PORT=3000

CMD ["bun", "--bun", "next", "dev"]
