FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS prod-deps
RUN npm ci --omit=dev --no-audit --no-fund

FROM base AS deps
RUN npm ci --no-audit --no-fund

FROM deps AS build
COPY . .

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/src ./src
COPY --from=build --chown=appuser:appgroup /app/package*.json ./

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]