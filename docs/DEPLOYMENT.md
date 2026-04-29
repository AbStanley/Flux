# Deployment & Operations Guide

## 🚀 Quick Start (Production)

Start the entire application (Client + Server + Database + Caddy) in production mode:

```bash
npm run docker:prod
```

- **Web App**: `https://localhost` (via Caddy reverse proxy)
- **Client (direct)**: `http://localhost:8081`
- **API (direct)**: `http://localhost:3001`
- **Database**: Port `5433` (User: `postgres`, Pass: `postgres`, DB: `flux_db`)

Stop the application:

```bash
docker compose -f docker-compose.yml down
```

---

## 🧪 Development (Docker)

Run a separate development stack (with different ports to avoid conflicts with production):

```bash
npm run docker:dev
```

- **Client**: `http://localhost:8083`
- **API**: `http://localhost:3002`
- **Database**: Port `5435`

Stop:

```bash
docker compose -f docker-compose.dev.yml down
```

---

## 🖥️ Local Development (No Docker)

Run frontend and backend natively for the fastest development cycle:

```bash
# Start only the database
docker compose up -d postgres

# Run migrations
npx prisma migrate dev --schema=apps/server/prisma/schema.prisma

# Start both apps
npm run dev
```

- **Client**: `http://localhost:5173` (Vite dev server)
- **API**: `http://localhost:3000`
- **Prisma Studio**: `http://localhost:5555`

---

## 🗄️ Database Operations

The production database runs in a Docker container mapped to port **5433** on your host (to avoid conflicts with local dev postgres on 5432).

### 1. Apply Schema Changes (Migrations)

If you modify `apps/server/prisma/schema.prisma`, run this to update the DB:

```bash
# macOS / Linux
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/flux_db" \
  npx --workspace=@flux/server prisma migrate dev
```

```powershell
# Windows PowerShell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/flux_db"; npx --workspace=@flux/server prisma migrate dev
```

### 2. Open Database GUI (Prisma Studio)

To inspect production data:

```bash
# macOS / Linux
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/flux_db" \
  npx --workspace=@flux/server prisma studio
```

```powershell
# Windows PowerShell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/flux_db"; npx --workspace=@flux/server prisma studio
```

### 3. Reset Database

To wipe the database and re-apply all migrations:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/flux_db" \
  npx --workspace=@flux/server prisma migrate reset
```

---

## 🔄 Updating the Application

### If you changed Code (Client or Server)

You need to rebuild the Docker images:

```bash
# Stop running containers
docker compose -f docker-compose.yml down

# Rebuild and start
docker compose -f docker-compose.yml up --build -d
```

### If you changed Dependencies (package.json)

Same as above, a rebuild is required to install new packages.

### If you changed the Database Schema

After rebuilding, run migrations against the appropriate database port (see Database Operations above).

---

## 🌐 Network & TLS

### Caddy Reverse Proxy

Caddy handles all routing and TLS:
- `/api/*` requests are proxied to the NestJS backend.
- All other requests are served by the React frontend.
- Auto-generates internal TLS certificates for HTTPS on localhost.

### LAN Access

To access Flux from other devices on your network:
1. Use `https://<YOUR-LAN-IP>` from another device.
2. Accept the self-signed certificate warning.
3. Ensure your firewall allows inbound traffic on the Caddy port (443 for prod, 8443 for dev).
