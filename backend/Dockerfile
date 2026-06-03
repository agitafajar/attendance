FROM node:22.13.0-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:22.13.0-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:22.13.0-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package*.json ./

RUN mkdir -p /app/uploads && chown -R app:app /app

USER app

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
