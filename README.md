# Flux

Flux is a premium, privacy-focused reading assistant application designed to bridge the gap between language learning and fluent reading. It leverages local AI to provide instant key-value translations, context-aware insights, and a natural audio reading experience.

## ✨ Core Features

### 🧠 Smart Reader
The core reading engine allows for deep interaction with text:
- **Interactive Tokenization**: Text is processed into interactive tokens, allowing users to select individual words or phrases.
- **Context-Aware Dictionary**: Hover over any word to see a translation that considers the surrounding sentence context, not just the isolated definition.
- **Streaming Generation**: Generate custom reading material with AI, featuring real-time streaming feedback and a "glass" overlay to prevent interaction during generation.

### 🔊 Audio Experience
A fully integrated text-to-speech system designed for learners:
- **Neural TTS**: Utilizes the browser's best available voices for natural speech.
- **Karaoke Highlighting**: Words are highlighted in real-time as they are spoken, aiding in pronunciation and tracking.
- **Smart Resume**: Playback remembers your position. If paused or stopped, it resumes intelligently from the start of the last spoken sentence or word.
- **Auto-Voice Selection**: Automatically switches the synthesis voice to match the detected language of the text.

### 🛡️ Privacy & Local AI
Flux is built to run entirely offline (after setup) using **Ollama**:
- **Zero Data Leakage**: All translations and text generation happen on your local machine.
- **Cost Efficient**: No API keys or usage fees.

## 🏗 Technical Architecture

Flux is built on **Clean Architecture** and **SOLID principles**, ensuring scalability and maintainability.

### System Design
- **Feature-Based Structure**: The codebase is organized by domain (e.g., `features/reader`, `features/controls`) rather than technical layers, making navigation intuitive.
- **Separation of Concerns**: complex logic is decoupled from UI components.
    - **Presentation**: React components (Views) and granular Zustand stores.
    - **Infrastructure**: Concrete implementations of services (e.g., `OllamaService`).
    - **Core**: Domain interfaces and contracts.

### State Management
We utilize **Zustand** for high-performance, granular state management, split into three focused stores to minimize re-renders:
1.  **`useReaderStore`**: Manages the "book" state—content, pagination, and selection logic.
2.  **`useTranslationStore`**: Handles transient interaction state—hover lookups, debouncing, and caching.
3.  **`useAudioStore`**: Controls the media engine—playback state, rates, and synchronization.

### Performance Optimizations
- **Memoization**: Critical components like `ReaderToken` are memoized (`React.memo`) to prevent wasted renders during high-frequency events (like audio highlighting).
- **Scoped Props**: Data is passed intelligently to ensure that changing the state of one word does not force the entire page to re-render.

## 🧩 App vs. Extension Architecture

Flux operates as a **Hybrid Application**, reusing core logic across two distinct environments:

### 1. The Chrome Extension
Designed for seamless, in-context assistance while browsing.
- **In-Page Reader (`src/content/`)**:
    - Injects a lightweight React app (`FluxContentApp`) into every visited page via Shadow DOM.
    - Provides the "Popup" interface for instant translation/summarization.
- **Background Worker (`src/background/`)**:
    - Acts as the central hub for the extension.
    - Handles cross-origin requests (CORS proxies) to the local Ollama instance.
    - Manages context menus and side panel coordination.

### 2. The Web Application (Side Panel)
Designed for deep reading, library management, and configuration.
- **Main Interface (`src/presentation/`)**:
    - This is the "Full App". It functions as both the standalone web dashboard and the Extension's Side Panel.
    - **Dual Mode**: `App.tsx` detects if it's running inside the extension to listen for events (like text selection from the content script), otherwise acts as a standard web app.

### 3. Shared Infrastructure
- **Smart Services (`src/infrastructure/`)**:
    - Services like `OllamaService` context-switch automatically.
    - **Web Mode**: Fetches directly from localhost.
    - **Extension Mode**: Delegates requests to the Background Worker to bypass browser security restrictions.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/ui, Framer Motion
- **State**: Zustand
- **AI/LLM**: Ollama (Local)
- **Containerization**: Docker, Nginx

## 📂 Project Structure

```
src/
├── core/                  # Domain Interfaces & Shared Types
├── infrastructure/        # External Services (API, Audio)
├── presentation/          # UI Layer
│   ├── components/        # Shared/Generic Components
│   ├── features/          # Domain-Specific Modules
│   │   ├── controls/      # Input, Settings, Audio Controls
│   │   └── reader/        # Main Reading Surface & Logic
│   ├── ui/                # Design System (shadcn/ui implementation)
│   ├── App.tsx            # Application Root
│   └── main.tsx           # Entry Point
└── styles/                # Global CSS
```

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+
- **Docker**: (Optional, for containerized run)
- **Ollama**: Installed and running (`ollama serve`). Ensure you have pulled the models you intend to use (e.g., `ollama pull llama3`).

### Running Locally
To run the application directly on your host machine:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Start Development Server**:
    ```bash
    npm run dev
    ```
3.  **Build for Production**:
    ```bash
    npm run build
    ```

### Running with Docker
For a consistent environment with a pre-configured Nginx reverse proxy (handles CORS for Ollama automatically):

1.  **Start the Stack**:
    ```bash
    npm run docker:up
    ```
    The app will be available at `http://localhost`.

2.  **Stop the Stack**:
    ```bash
    npm run docker:down
    ```
