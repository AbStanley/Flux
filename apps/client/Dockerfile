# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Patch any known Alpine vulnerabilities and install pnpm
RUN apk update && apk upgrade --no-cache && apk add --no-cache pnpm && rm -rf /var/cache/apk/*

# Copy package.json
COPY package.json ./

# Install dependencies
RUN pnpm config set strict-dep-builds false && pnpm install

# Copy the rest of the application code
COPY . .

# Build the application with explicit empty API URL
RUN VITE_API_URL='' VITE_OLLAMA_URL='' VITE_IS_WEB_APP='true' pnpm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Patch any known Alpine vulnerabilities at build time
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
