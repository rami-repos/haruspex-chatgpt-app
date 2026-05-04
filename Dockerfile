FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY server ./server
COPY web ./web

RUN npm ci
RUN npm run build
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV MCP_PATH=/mcp
ENV HARUSPEX_API_BASE_URL=https://haruspex.guru/api/v1
ENV HARUSPEX_APP_NAME=haruspex-chatgpt-app
ENV HARUSPEX_APP_VERSION=0.1.0

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '8080') + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["npm", "start"]
