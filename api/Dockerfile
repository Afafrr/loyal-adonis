FROM node:24.18.0-bookworm-slim AS base

WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production

COPY --from=build --chown=node:node /app/build ./
COPY --from=build --chown=node:node /app/bin/docker-entrypoint /usr/local/bin/docker-entrypoint
RUN chmod +x /usr/local/bin/docker-entrypoint && npm ci --omit=dev

USER node

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint"]
CMD ["node", "bin/server.js"]
