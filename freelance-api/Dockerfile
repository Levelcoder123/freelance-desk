FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache tini
COPY package*.json ./

FROM base AS prod-deps
RUN npm ci --omit=dev --no-audit --no-fund

FROM base AS deps
RUN npm ci --no-audit --no-fund

FROM deps AS build
COPY . .

FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache tini
ENV NODE_ENV=production

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/src ./src
COPY --from=build --chown=node:node /app/package*.json ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]