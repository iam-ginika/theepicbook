# Dependency stage: production packages only. package files are copied first
# so this layer stays cached until the dependencies actually change.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Runtime stage: no npm, no build cache. Code stays root-owned and read-only to the app.
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 8080
CMD ["node", "server.js"]
