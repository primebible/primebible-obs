FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

# Default port; config.json sets 4456, override with -e PORT=...
EXPOSE 4456

CMD ["node", "server.js"]
