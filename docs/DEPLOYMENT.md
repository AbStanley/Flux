# Deployment & Operations Guide

## 🚀 Quick Start (Production)

Start the entire application (Client + Server + Database) in production mode:

```powershell
npm run docker:prod
```

- **Client**: [http://localhost:8081](http://localhost:8081)
- **API**: [http://localhost:3001](http://localhost:3001)
- **Database**: Port `5433` (User: `postgres`, Pass: `postgres`, DB: `readerhelper`)

Stop the application:

```powershell
docker compose -f docker-compose.yml down
```

---

## 🗄️ Database Operations

The production database runs in a Docker container mapped to port **5433** on your host (to avoid conflicts with local dev postgres on 5432).

### 1. Apply Schema Changes (Migrations)
If you modify `apps/server/prisma/schema.prisma`, run this to update the DB:

```powershell
# Windows PowerShell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/readerhelper"; npx --workspace=@reader-helper/server prisma migrate dev
```

### 2. Open Database GUI (Prisma Studio)
To inspect production data:

```powershell
# Windows PowerShell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/readerhelper"; npx --workspace=@reader-helper/server prisma studio
```

---

## 🔄 Updating the Application

### If you changed Code (Client or Server)
You need to rebuild the Docker images:

```powershell
# Stop running containers
docker compose -f docker-compose.yml down

# Rebuild and start
docker compose -f docker-compose.yml up --build -d
```

### If you changed Dependencies (package.json)
Same as above, a rebuild is required to install new packages.
