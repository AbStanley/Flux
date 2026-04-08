# Environment Configuration Guide

This project uses a layered environment configuration system to support Local, Development (Docker), and Production environments.

## 📂 Overview of `.env` Files

| File | Location | Environment | Purpose |
| :--- | :--- | :--- | :--- |
| **`.env`** | Root | **All** | Contains global secrets like `JWT_SECRET` and Caddy port mappings. |
| **`.env.local`** | `apps/server/` | **Local** | Native host settings for `npm run server:dev`. |
| **`.env.docker`** | `apps/server/` | **Docker** | Internal container networking settings for Docker builds. |
| **`.env.local`** | `apps/client/` | **Local** | Extension config to target `localhost:3000`. |
| **`.env.development`**| `apps/client/` | **Dev (Docker)**| Extension config to target `localhost:8443`. |
| **`.env.production`** | `apps/client/` | **Prod (Docker)**| Extension config to target `localhost:443`. |

---

## 🛠️ Server-side Logic (NestJS)

The server loads environment files in the following priority order (defined in `app.module.ts`):
1. `apps/server/.env.local`
2. `apps/server/.env.docker`
3. `./.env` (Root)

### Why two files?
- **`.env.local`**: Use this when running the server directly on your machine. It connects to database ports exposed to your host (e.g., `5435`).
- **`.env.docker`**: Use this when the server is inside Docker. It connects to services using internal container names (e.g., `postgres:5432`) and reaches the host via `host.docker.internal`.

---

## 🌐 Client-side Logic (Vite)

The client uses different "modes" to determine which API to talk to.

| Build Command | Mode | Target API | Used For |
| :--- | :--- | :--- | :--- |
| `npm run dev` | `development` | `http://localhost:3000` | Local web app dev |
| **`npm run build:local`** | `local` | `http://localhost:3000` | Testing extension vs local server |
| **`npm run build:dev`** | `development` | `https://localhost:8443`| Testing extension vs Dev Docker |
| **`npm run build`** | `production` | `https://localhost` | Standard Production deployment |

---

## 🔒 Security Note
- Files named `.env*` are **gitignored** (except `.env.docker` and `.env.production` which contain non-sensitive public URLs).
- `JWT_SECRET` is defined in the root `.env` and must never be committed.

---

## 🔗 External Service Configuration

### Ollama
Ollama's host URL is configured in the server environment files:
- **Local**: Points to `http://localhost:11434` (default Ollama port).
- **Docker**: Points to `http://host.docker.internal:11434` to reach Ollama running on the host.

The server auto-detects available models via the `/api/tags` endpoint.

### Anki (Optional)
AnkiConnect runs on `http://localhost:8765` by default. The client connects directly (not proxied through the backend) using `text/plain` content-type headers for CORS compatibility. No server-side configuration needed.
