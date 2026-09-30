# syntax=docker/dockerfile:1

# ── Stage 1: Build Stage ─────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies needed for compilation
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
COPY shared/ ./shared/

# Install root & workspace dependencies
RUN npm ci --workspace=server --workspace=client

# Copy server source code and tsconfig
COPY server/ ./server/
COPY shared/ ./shared/

# Build server TypeScript output to server/dist
RUN npm run build --workspace=server

# Prune devDependencies to keep image lean
RUN npm prune --production --workspace=server

# ── Stage 2: Production Runtime ──────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Security: Run as unprivileged node user
USER node

# Copy production node_modules and built artifacts
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/server/node_modules ./server/node_modules
COPY --chown=node:node --from=builder /app/server/dist ./server/dist
COPY --chown=node:node --from=builder /app/server/package.json ./server/package.json
COPY --chown=node:node --from=builder /app/shared ./shared

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["node", "server/dist/index.js"]
