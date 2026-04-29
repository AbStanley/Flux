#!/bin/bash
# Flux Migration Script
set -e

# Argument Parsing
EXPORT_ONLY=false
IMPORT_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --export)
      EXPORT_ONLY=true
      shift
      ;;
    --import)
      IMPORT_ONLY=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# Detect Project Root
if [ -f "./docker-compose.yml" ] || [ -f "./docker-compose.legacy.yml" ] || [ -f "./docker-compose.hub.yml" ]; then
    PROJECT_ROOT="$(pwd)"
elif [ -f "../docker-compose.yml" ]; then
    PROJECT_ROOT="$(cd .. && pwd)"
else
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

SHOULD_EXPORT=true
SHOULD_IMPORT=true

if [ "$EXPORT_ONLY" = true ]; then SHOULD_IMPORT=false; fi
if [ "$IMPORT_ONLY" = true ]; then SHOULD_EXPORT=false; fi

# --- 1. EXPORT PHASE ---
if [ "$SHOULD_EXPORT" = true ]; then
    echo "🔍 Searching for old container..."
    # Look for any running postgres container that is NOT the new flux one
    OLD_CONTAINER=$(docker ps --format "{{.Names}}" | grep "postgres" | grep -v "flux-postgres" | head -n 1)

    if [ -n "$OLD_CONTAINER" ]; then
        if [ -f "$BACKUP_FILE" ]; then
            read -p "⚠️ Found existing backup at $BACKUP_FILE. Overwrite with fresh export? (y/n) " overwrite
            if [ "$overwrite" != "y" ]; then
                echo "⏭️ Skipping export, using existing backup."
                SHOULD_EXPORT=false
            fi
        fi

        if [ "$SHOULD_EXPORT" = true ]; then
            echo "📦 Detected old container: $OLD_CONTAINER"
            echo "📦 Exporting data from $OLD_CONTAINER..."
            docker exec "$OLD_CONTAINER" pg_dump -U postgres --clean --if-exists "$OLD_DB_NAME" > "$BACKUP_FILE"
            echo "✅ Data exported to $BACKUP_FILE"
        fi
    else
        if [ -f "$BACKUP_FILE" ]; then
            echo "ℹ️ No active legacy container found, but backup exists. Using $BACKUP_FILE."
        else
            echo "❌ Error: No legacy 'postgres' container found and no backup exists at $BACKUP_FILE."
            echo "Please start your old database first (e.g., docker compose -f docker-compose.legacy.yml -p reader-helper up -d)"
            exit 1
        fi
    fi

    if [ "$EXPORT_ONLY" = true ]; then
        echo "🛑 Stopping old services..."
        [ -f "$PROJECT_ROOT/docker-compose.legacy.yml" ] && docker compose -f "$PROJECT_ROOT/docker-compose.legacy.yml" down || true
        echo "✨ Export phase complete. You can now 'work on' $BACKUP_FILE."
        echo "Run './migrate.sh --import' when ready to finish."
        exit 0
    fi
fi

# --- 2. IMPORT PHASE ---
if [ "$SHOULD_IMPORT" = true ]; then
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "❌ Error: Backup file $BACKUP_FILE not found. Run export first."
        exit 1
    fi

    # Stop Old Services if we didn't do it in export-only mode
    if [ "$EXPORT_ONLY" = false ]; then
        echo "🛑 Stopping old services..."
        [ -f "$PROJECT_ROOT/docker-compose.legacy.yml" ] && docker compose -f "$PROJECT_ROOT/docker-compose.legacy.yml" down || true
        [ -f "$PROJECT_ROOT/docker-compose.dev.yml" ] && docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" -p reader-helper-dev down || true
        [ -f "$PROJECT_ROOT/docker-compose.yml" ] && docker compose -f "$PROJECT_ROOT/docker-compose.yml" -p reader-helper-prod down || true
    fi

    # Start New Flux Database
    echo "🏗️ Starting new Flux database..."
    if [ -f "$PROJECT_ROOT/docker-compose.hub.yml" ]; then
        COMPOSE_FILE="$PROJECT_ROOT/docker-compose.hub.yml"
    elif [ -f "$PROJECT_ROOT/docker-compose.new.yml" ]; then
        COMPOSE_FILE="$PROJECT_ROOT/docker-compose.new.yml"
    elif [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
    else
        COMPOSE_FILE="$PROJECT_ROOT/docker-compose.dev.yml"
    fi

    PROJECT_NAME="flux"
    POSTGRES_CONTAINER="flux-postgres-1"

    echo "📦 Using configuration: $COMPOSE_FILE"
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d postgres

    # Wait for postgres to be ready
    echo "⏳ Waiting for postgres to be ready..."
    until docker exec "$POSTGRES_CONTAINER" pg_isready -U postgres >/dev/null 2>&1; do
      sleep 1
    done

    # Create new DB
    echo "💎 Ensuring $NEW_DB_NAME exists..."
    docker exec "$POSTGRES_CONTAINER" psql -U postgres -c "CREATE DATABASE $NEW_DB_NAME;" >/dev/null 2>&1 || echo "DB already exists."

    # Import Data
    echo "📥 Importing data into $NEW_DB_NAME..."
    cat "$BACKUP_FILE" | docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d "$NEW_DB_NAME"
    if [ $? -eq 0 ]; then
        echo "✅ Database migration successful!"
    fi

    # Start Full App
    echo "⏳ Attempting to start Flux services..."
    
    # Try to pull, but don't stop on failure
    echo "🔍 Pulling images from Docker Hub..."
    if ! docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" pull; then
        echo "⚠️  Note: Could not pull images from Docker Hub (likely manifest mismatch)."
        echo "If you have the source code here, I can try to 'build' them locally for you."
        
        read -p "Try to build locally? (y/n) " choice
        if [ "$choice" == "y" ]; then
            echo "🏗️  Building images locally..."
            docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build
        fi
    fi

    echo "🚀 Starting the Flux stack..."
    if docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d; then
        echo "✨ Migration complete and FULL APP is running!"
    else
        echo "🔸 Migration complete, but only the DATABASE is running."
        echo "To fix the web/server, ensure images are pushed with multi-platform support."
    fi
fi

