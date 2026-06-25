FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

EXPOSE 1420
EXPOSE 1421

ENV TAURI_DEV_HOST=0.0.0.0

CMD ["npm", "run", "dev"]
