# ---- Build stage ----
FROM node:26-alpine3.23 AS builder

WORKDIR /app

# Patch any known Alpine vulnerabilities at build time
RUN apk update && apk upgrade --no-cache && apk add --no-cache openssl pnpm && rm -rf /var/cache/apk/*

COPY package.json ./
RUN pnpm config set strict-dep-builds false && pnpm install

COPY . .

RUN pnpm exec prisma generate
RUN pnpm run build

# ---- Production stage ----
FROM node:26-alpine3.23

# Patch any known Alpine vulnerabilities at build time
RUN apk update && apk upgrade --no-cache && apk add --no-cache openssl pnpm && rm -rf /var/cache/apk/*

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Install production dependencies only + generate Prisma client for this platform
# We set store-dir to /tmp and wipe it afterwards to prevent pnpm from caching tarballs in the final image layer
RUN pnpm config set store-dir /tmp/pnpm-store && \
    pnpm config set strict-dep-builds false && \
    pnpm install --prod && \
    pnpm exec prisma generate && \
    rm -rf /tmp/pnpm-store && \
    rm -rf /root/.npm

# Copy compiled output
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["/bin/sh", "-c", "pnpm exec prisma migrate deploy && pnpm run start:prod"]
