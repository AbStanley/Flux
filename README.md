# Flux: A Privacy-First, Intelligent Learning Assistant

![Status](https://img.shields.io/badge/Status-Operational-success?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ed?style=for-the-badge&logo=docker)
![Ollama](https://img.shields.io/badge/Ollama-Enabled-2496ed?style=for-the-badge&logo=ollama)

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![NestJS](https://img.shields.io/badge/NestJS-E02347?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-4169E1?style=for-the-badge&logo=zustand&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-466BB0?style=for-the-badge&logo=postgresql&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-000000?style=for-the-badge&logo=framer&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white)

![Architecture](https://img.shields.io/badge/Architecture-Clean-orange?style=for-the-badge)

**Flux** is a premium, privacy-focused reading and learning assistant designed to bridge the gap between language learning and fluent reading. It leverages **Self-Hosted AI** (Ollama) to provide context-aware translations, grammar analysis, gamified learning, and a natural audio reading experience -- all running locally on your machine.

> [!NOTE]
> This project is a **Monorepo** containing both the React 19 Frontend (Vite) and the NestJS Backend, managed with NPM Workspaces.

## ✨ Core Features

### 🧠 Smart Reader

The core reading engine provides deep interaction with text across two modes:

- **Interactive Tokenization**: Text is processed into interactive tokens, allowing selection of individual words, phrases, or sentences.
- **Context-Aware Dictionary**: Hover over any word to see a translation that considers the surrounding sentence context, not just the isolated definition.
- **Rich Translation Panel**: Multi-tab translation details including word-by-word breakdowns, examples, and alternatives.
- **Grammar Mode**: Dedicated linguistic analysis mode with color-coded parts of speech, inflection details, conjugation tables, and alternatives.
- **Streaming Generation**: Generate custom reading material with AI, featuring real-time streaming feedback (NDJSON).
- **Sentence Navigation**: Jump between sentences with grouped translation context.
- **Content Import**: Import PDF and EPUB files directly into the reader via drag-and-drop.

### 🔊 Audio Experience

A fully integrated text-to-speech system designed for learners:

- **Neural TTS**: Utilizes the browser's best available voices for natural speech.
- **Karaoke Highlighting**: Words are highlighted in real-time as they are spoken, aiding in pronunciation and tracking.
- **Smart Resume**: Playback remembers your position. If paused or stopped, it resumes intelligently from the start of the last spoken sentence or word.
- **Audio-Page Sync**: Automatic page synchronization during playback.

### 🎮 Learning Mode

A gamified training arena with five distinct game types:

- **Multiple Choice**: 4-option vocabulary quizzes with context hints and optional timer.
- **Word Builder**: Spell words letter-by-letter from a shuffled letter pool.
- **Audio Dictation**: Listen and spell what you hear, with mode toggling between dictation and translation.
- **Sentence Scramble**: Reconstruct target-language sentences by ordering word tiles.
- **Story Mode**: Read AI-generated narrative contexts and translate target words inline.

Three data sources for learning content:

- **Saved Words (DB)**: Pull from your saved vocabulary, filtered by language pair.
- **Anki Integration**: Connect to your local Anki via AnkiConnect -- browse decks, select models, and map fields.
- **AI Generation**: Generate fresh content on-the-fly by topic and proficiency level (A1-C2).

Includes a full progression system with XP, levels, streaks, health, and statistics tracking.

### 📚 Word Manager

A comprehensive vocabulary management system:

- **Dual Tabs**: Separate views for Words and Phrases.
- **Rich Metadata**: Definition, explanation, context, pronunciation, source language/title, and image URL per entry.
- **AI-Generated Examples**: One-click example sentence generation via Ollama.
- **Deck Organization**: Group vocabulary into custom decks.
- **Export**: CSV export and Anki deck export (.apkg format).
- **Saved Words Panel**: Quick-access panel within the reader for recently saved vocabulary.

### ✍️ Interactive Writing

A premium, distraction-free environment for refining your thoughts:

- **Real-Time AI Polish**: Automatically identifies and suggests improvements for **Grammar**, **Spelling**, **Punctuation**, and **Fluency**.
- **Interactive Corrections**: Click on highlighted text to see detailed explanations and instantly "Correct" or "Discard" suggestions with one click.
- **Smart Offset Tracking**: Corrections stay aligned as you continue editing, with intelligent position reconciliation.
- **History Management**: Undo/redo support with a 20-item history buffer.
- **Privacy-First Analysis**: Your writing is processed by your local LLM (via Ollama), ensuring sensitive text never leaves your hardware.
- **Distraction-Free Mode**: Toggle between "Full" correction mode and a "Minimal" mode for a clean, paper-like writing experience.

### 🎨 Themes & Customization

- **5 Built-in Themes**: Light, Dark, Nordic, Cream, Sunset.
- **Custom Theme Builder**: Create your own theme with 30+ editable CSS variables.
- **8 Font Families**: System, Merriweather, Literata, Lora, Crimson Pro, EB Garamond, Inter, Roboto.
- **4 Font Sizes**: Small, Medium, Large, XL.
- **Proficiency Levels**: Configure your CEFR level (A1-C2) to control AI content difficulty.
- **LLM Model Selection**: Auto-detect or manually select available Ollama models.

### 🧩 Chrome Extension

Flux also works as a Chrome Extension:

- **Side Panel Mode**: Run the full app inside Chrome's side panel.
- **Text Selection Capture**: Select text on any web page and send it to the reader.
- **Chrome Storage Sync**: Persistent state across browser sessions.

### 🛡️ Privacy & Local AI

Flux is built to run entirely offline (after setup) using **Ollama**:

- **Zero Data Leakage**: All translations, grammar analysis, and text generation happen on your local machine via the Backend Proxy.
- **Cost Efficient**: No API keys or usage fees.
- **Cloud-Ready Architecture**: The frontend is API-agnostic -- the backend can be extended to proxy OpenAI/Anthropic without changing the client.

---

## 🚀 Getting Started

### 0. Environment Setup

1. Copy `.env.example` to `.env` (or create one).
2. Set `JWT_SECRET` to a strong random string.

#### Configuration

For a detailed explanation of how environment variables work in this project (Local vs Docker vs Production), see the [**Environment Configuration Guide**](./docs/ENVIRONMENT.md).

**Quick Port Reference (Root `.env`):**

- `CADDY_PORT_DEV=8443`
- `CADDY_PORT_PROD=443`

Note: You might need to allow the firewall to allow the ports to be accessible from your network.

``` powershell
New-NetFirewallRule -DisplayName "Flux Prod Server (443)" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

### 1. Prerequisites

- **Node.js**: v18+
- **Docker**: Required for the PostgreSQL database and Caddy Proxy.
- **Ollama**: Installed locally/networked. Run `ollama serve` and pull your models.
- **Anki** *(optional)*: For Anki integration, install [AnkiConnect](https://ankiweb.net/shared/info/2055492159) add-on.

### 2. Installation & Run

We use **NPM Workspaces** to manage the full stack from the root directory.

```bash
# 1. Install Dependencies (Frontend + Backend)
npm install

# 2. Start Infrastructure (Postgres)
# (In a separate terminal)
docker compose up -d postgres

# 3. Setup Database
npx prisma migrate dev --schema=apps/server/prisma/schema.prisma

# 4. Start Development (Both Apps)
npm run dev
```

The platform will be available at:

- **Web App (HTTPS)**: `https://localhost` (or `https://<YOUR-LAN-IP>`)
  - *Note: Accept the self-signed certificate warning.*
- **Backend API**: Internal only (proxied via Caddy).
- **Prisma Studio**: `http://localhost:5555` (View your data)

---

## Prisma Migrations Workflow

When you make changes to the database schema (`apps/server/prisma/schema.prisma`), you need to create and apply a new migration.

Here's the exact sequence after pulling migration changes:

### Step 1: cd into the server app

  cd apps/server  

### Step 2: Apply any new migrations to your local DB

  npx prisma migrate dev

### Step 3: Regenerate the Prisma client (so TypeScript gets new types)

  npx prisma generate

## Prisma Database Commands

> **Important:** Prisma CLI needs `DATABASE_URL` to connect. Ensure `apps/server/.env` exists with the correct connection string for your environment:
>
> - **Local dev** (Docker postgres): `DATABASE_URL=postgresql://postgres:postgres@localhost:5435/readerhelper`
> - **Docker dev**: Set automatically via `docker-compose.dev.yml`
> - **Production**: Set automatically via `docker-compose.yml`

### Local Development Workflow

After changing `apps/server/prisma/schema.prisma`:

```bash
# 1. Create & apply the migration
cd apps/server && npx prisma migrate dev --name your_migration_name

# 2. Regenerate the Prisma client (so TypeScript picks up new types)
npx prisma generate

# 3. Restart the server
cd ../.. && npm run server:dev
```

### Production Deployment

```bash
# Apply pending migrations without creating new ones (safe for prod)
cd apps/server && npx prisma migrate deploy
```

### All Commands Reference

| Command | Description |
|---------|-------------|
| `cd apps/server && npx prisma migrate dev --name <name>` | Create + apply migration (dev only) |
| `cd apps/server && npx prisma migrate deploy` | Apply pending migrations (prod) |
| `cd apps/server && npx prisma migrate status` | Check migration status |
| `cd apps/server && npx prisma migrate reset --force` | Reset DB & reapply all migrations (dev only, destructive) |
| `cd apps/server && npx prisma generate` | Regenerate Prisma client after schema changes |
| `npm run prisma-prepare` | Shortcut: generate Prisma client from root |
| `npm run prisma-studio` | Open Prisma Studio GUI to view/edit data |
| `cd apps/server && npx prisma db push` | Push schema without creating migration (dev prototyping) |
| `cd apps/server && npx prisma format` | Format the schema file |
| `cd apps/server && npx prisma validate` | Validate the schema file |

---

## 🏗 Technical Architecture

Flux is architected as a **"Self-Hosted Cloud"**.

### The Hybrid Monorepo

- **`apps/client`**: A React 19 application (Vite). It handles the UI, text rendering, audio orchestration, and gamified learning. It can also run as a Chrome Extension.
- **`apps/server`**: A NestJS Backend. It acts as the "Brain" and Proxy. It connects to the database for saving words/decks, proxies requests to Ollama, and manages authentication.

### Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Zustand, Framer Motion, Radix UI, PDF.js, EPUB.js.
- **Backend**: NestJS 11, Prisma (ORM), Express, JWT Authentication.
- **Database**: PostgreSQL 15 (Dockerized).
- **Infrastructure**: Caddy (Reverse Proxy + Auto TLS).
- **AI**: Ollama (Local LLM).

---

## 🔧 Troubleshooting

### "Port already allocated"

If Docker fails to start with port errors:

1. **Restart Docker Desktop** (Right-click -> Quit -> Start). This clears zombie ports.
2. Run `npm run docker:dev` again.

### LAN Access Issues

1. Ensure Windows Network Profile is **Private** (Powershell: `Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private`).
2. Use `https://` explicitly.
3. Accept the "Not Secure" warning (Advanced -> Proceed).

---

## 📂 Project Structure

```bash
/
├── apps/
│   ├── client/                 # The Frontend Web App (React 19 + Vite)
│   │   └── src/
│   │       ├── presentation/   # UI Layer
│   │       │   ├── features/   # Feature modules (reader, learning-mode, word-manager, writing, auth, importer, settings, navigation)
│   │       │   └── components/ # Shared UI components
│   │       └── infrastructure/ # Services (API clients, audio, auth, AI, settings)
│   └── server/                 # The Backend API & Proxy (NestJS)
│       ├── src/
│       │   ├── auth/           # JWT Authentication (register, login, guards)
│       │   ├── words/          # Word/Deck CRUD (controller, service, DTOs)
│       │   └── ollama/         # AI Proxy (generation, translation, grammar, writing)
│       └── prisma/             # Database schema & migrations
├── docs/                       # Documentation (Architecture, Environment, Deployment)
├── docker-compose.yml          # Production infrastructure
├── docker-compose.dev.yml      # Development infrastructure
├── Caddyfile                   # Reverse proxy routing
└── README.md                   # This file
```

For deep architectural details, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md).
