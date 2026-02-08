# Stage 1: deps (better caching)
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Stage 2: build
FROM node:20-alpine AS builder
WORKDIR /app

# copy deps
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# copy source + ts configs
COPY tsconfig*.json ./
COPY src ./src

# build
RUN npm run build

# Stage 3: production runtime (small)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# only prod deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# copy build output
COPY --from=builder /app/dist ./dist

# non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5000
CMD ["node", "dist/server.js"]
