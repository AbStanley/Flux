# Push Flux images to Docker Hub
$ErrorActionPreference = "Stop"

# Navigate to the repository root directory (parent of the scripts folder)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$ScriptDir\.."

Write-Host "🏗️ Building all custom Flux images..." -ForegroundColor Cyan
# --pull ensures we get the latest base images (Node, Alpine, etc.)
# --no-cache ensures we don't use stale code
docker compose build --pull --no-cache

Write-Host "📤 Pushing Flux images to Docker Hub..." -ForegroundColor Cyan
docker push abstanley/flux-web:latest
docker push abstanley/flux-server:latest
docker push abstanley/flux-caddy:latest

Write-Host "✅ All images built and pushed successfully!" -ForegroundColor Green
