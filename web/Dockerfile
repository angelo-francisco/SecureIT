FROM oven/bun:1.3.14 AS base

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lockb* ./

RUN bun install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

ENV PORT=3000

CMD ["bun", "--bun", "next", "dev"]