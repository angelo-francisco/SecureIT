FROM oven/bun:1.3.14 AS base
WORKDIR /app

COPY package.json bun.lockb* ./

RUN bun install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

ENV PORT=3000

CMD ["bun", "--bun", "next", "dev"]
