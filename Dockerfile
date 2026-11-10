# syntax=docker/dockerfile:1

# Stage 1: install dependencies and build the React frontend.
FROM node:26.13.0-alpine3.24 AS builder
WORKDIR /app

# Copy dependency manifest first so Docker can reuse this layer when source changes.
COPY package.json ./
RUN npm install

# Copy application source only after dependencies have been installed.
COPY vite.config.js ./
COPY tsconfig.json ./
COPY client ./client
COPY server ./server
RUN npm run typecheck && npm run build

# Stage 2: production runtime. Development/build dependencies are not copied.
FROM node:26.13.0-alpine3.24 AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Reuse the lockfile created in the builder and install production dependencies only.
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000
USER node
CMD ["node", "server/index.js"]
