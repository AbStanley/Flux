# ---- Build stage ----
FROM node:25-alpine3.23 AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

# ---- Production stage ----
FROM node:25-alpine3.22

# Patch any known Alpine vulnerabilities at build time
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/prisma ./prisma

# Install production dependencies only + generate Prisma client for this platform
RUN npm ci --omit=dev && npx prisma generate && npm cache clean --force

# Copy compiled output (only .js files, skip .d.ts and .map)
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["/bin/sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
