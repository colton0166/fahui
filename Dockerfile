# syntax=docker/dockerfile:1

# ── deps：只安裝相依套件，讓這層能被 Docker 快取 ──────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── builder：產生 .next/standalone ──────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── runner：只帶執行期需要的檔案，不含原始碼與開發相依 ────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=10000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs \
  && adduser -S -u 1001 -G nodejs nextjs

# public 需一併複製，否則 /poster.jpg 之類的靜態檔會 404
COPY --from=builder /app/public ./public
# standalone 內含 server.js 與精簡過的 node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# static 不在 standalone 內，必須另外複製，否則 CSS/JS 全部 404
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 10000

# server.js 位於 /app（standalone 解到 WORKDIR 根部），以 0.0.0.0:10000 監聽
CMD ["node", "server.js"]
