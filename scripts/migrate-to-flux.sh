#!/bin/bash
# Flux Migration Script
set -e

# Detect Project Root
# This handles running from root or from a scripts subfolder
if [ -f "./docker-compose.yml" ] || [ -f "./docker-compose.legacy.yml" ] || [ -f "./docker-compose.hub.yml" ]; then
    PROJECT_ROOT="$(pwd)"
elif [ -f "../docker-compose.yml" ]; then
    PROJECT_ROOT="$(cd .. && pwd)"
else
    # Fallback to script location logic
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [[ "$SCRIPT_DIR" == */scripts ]]; then
        PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    else
        PROJECT_ROOT="$SCRIPT_DIR"
    fi
fi

OLD_DB_NAME="readerhelper"
NEW_DB_NAME="flux_db"
BACKUP_FILE="$PROJECT_ROOT/readerhelper_migration_backup.sql"

echo "🚀 Starting Flux brand migration..."
echo "📂 Project Root: $PROJECT_ROOT"

# 1. Export Data
# Enhanced discovery: finds any old reader-helper postgres container
OLD_CONTAINER=$(docker ps --format "{{.Names}}" | grep "reader-helper" | grep "postgres" | head -n 1)

if [ -n "$OLD_CONTAINER" ]; then
    echo "📦 Detected old container: $OLD_CONTAINER"
    echo "📦 Exporting data from $OLD_CONTAINER..."
    docker exec "$OLD_CONTAINER" pg_dump -U postgres --clean --if-exists "$OLD_DB_NAME" > "$BACKUP_FILE"
    echo "✅ Data exported to $BACKUP_FILE"
else
    echo "⚠️ Warning: No 'reader-helper' postgres container found running."
    echo "If you have data in an existing volume but the container is not running, please start it first."
    exit 1
fi

# 2. Stop Old Services
echo "🛑 Stopping old services..."
# Attempt to stop any possible configurations relative to root
[ -f "$PROJECT_ROOT/docker-compose.legacy.yml" ] && docker compose -f "$PROJECT_ROOT/docker-compose.legacy.yml" down || true
[ -f "$PROJECT_ROOT/docker-compose.dev.yml" ] && docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" -p reader-helper-dev down || true
[ -f "$PROJECT_ROOT/docker-compose.yml" ] && docker compose -f "$PROJECT_ROOT/docker-compose.yml" -p reader-helper-prod down || true

# 3. Start New Flux Database
echo "🏗️ Starting new Flux database..."
# Determine which compose file to use for starting the new services
# Prioritize Hub and Prod to ensure we pull the new images from Docker Hub
if [ -f "$PROJECT_ROOT/docker-compose.hub.yml" ]; then
    COMPOSE_FILE="$PROJECT_ROOT/docker-compose.hub.yml"
    PROJECT_NAME="flux-hub"
    POSTGRES_CONTAINER="flux-hub-postgres-1"
elif [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
    PROJECT_NAME="flux-prod"
    POSTGRES_CONTAINER="flux-prod-postgres-1"
else
    COMPOSE_FILE="$PROJECT_ROOT/docker-compose.dev.yml"
    PROJECT_NAME="flux-dev"
    POSTGRES_CONTAINER="flux-dev-postgres-1"
fi

echo "📦 Using configuration: $COMPOSE_FILE"
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d postgres

# Wait for postgres to be ready
echo "⏳ Waiting for postgres to be ready..."
until docker exec "$POSTGRES_CONTAINER" pg_isready -U postgres; do
  sleep 1
done

# 4. Create new DB
echo "💎 Ensuring $NEW_DB_NAME exists..."
docker exec "$POSTGRES_CONTAINER" psql -U postgres -c "CREATE DATABASE $NEW_DB_NAME;" || echo "DB already exists."

# 5. Import Data
echo "📥 Importing data into $NEW_DB_NAME..."
cat "$BACKUP_FILE" | docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d "$NEW_DB_NAME"

# 6. Pull latest images and Start Full App
echo "⏳ Pulling latest Flux images from Docker Hub..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" pull

echo "🚀 Starting the full Flux stack..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d

echo "✨ Migration complete and app is running!"
