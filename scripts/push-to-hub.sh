#!/bin/bash
# Push Flux images to Docker Hub
set -e

echo "🏗️ Building all custom Flux images..."
# --pull ensures we get the latest base images (Node, Alpine, etc.)
# --no-cache ensures we don't use stale code
docker compose build --pull --no-cache

echo "📤 Pushing Flux images to Docker Hub..."
docker push abstanley/flux-web:latest
docker push abstanley/flux-server:latest
docker push abstanley/flux-caddy:latest

echo "✅ All images built and pushed successfully!"
