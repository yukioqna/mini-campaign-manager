FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace files (needed for yarn install with workspaces)
COPY package.json yarn.lock ./
COPY server/package.json ./server/
# Install all workspace dependencies at root (hoisted node_modules lives at /app/node_modules)
RUN yarn install --frozen-lockfile

# Build server (tsc picks up root tsconfig.json which references server/)
COPY server/ ./server/
WORKDIR /app/server
RUN yarn build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy built output, root node_modules (hoisted deps), and server source (for migrations)
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

# Run migrations using DATABASE_URL from environment, then start server
CMD ["sh", "-c", "yarn workspace server migrate --env production --url \"${DATABASE_URL}\" && node server/dist/index.js"]
