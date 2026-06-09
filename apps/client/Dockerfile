# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Enable Corepack and pin pnpm v11
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

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

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
