# Architecture & Development Guide

This document provides a deep dive into the internal architecture, state management strategies, and performance optimizations of the Reader Helper application.

## 🏗 High-Level Architecture

The application follows a **Clean Architecture** approach with a strong emphasis on performance and separation of concerns.

### Layers
1.  **Presentation (`src/presentation`)**:
    *   **Features**: Organized by domain (e.g., `reader`, `controls`).
    *   **Components**: Pure, presentational UI components.
    *   **Hooks**: Custom hooks for complex logic (`useTranslation`, `useHighlighting`).
    *   **Stores**: Global state management via Zustand.
2.  **Infrastructure (`src/infrastructure`)**:
    *   **AI Services**: Implementation of LLM interaction (Ollama).
    *   **Audio**: Web Speech API integration.
3.  **Core (`src/core`)**:
    *   **Interfaces**: Domain contracts (`IAIService`).
    *   **Types**: Shared type definitions.

---

## 🧩 Extension Architecture

The Chrome Extension shares the same core logic and UI as the web app but operates in a constrained environment.

### 1. Integration Strategy
*   **Shared Codebase**: ~95% of the code (Components, Hooks, Services) is shared.
*   **Entry Points**:
    *   **Side Panel**: Loads `index.html` (same as the Web App) but configured as a Side Panel in `manifest.json`.
    *   **Content Scripts** (`src/content`): Isolated JavaScript environments that run on visited web pages to extract text.
    *   **Background Script** (`src/background`): Handles extension lifecycle events.

### 2. Limitations
*   **Router**: The generic `react-router` or URL-based routing may behave differently. We rely on internal state (Zustand) for view switching rather than URLs where possible.
*   **Permissions**: `manifest.json` governs permissions. External API calls (like Ollama) must be CORS-compatible or proxied if necessary (though strictly local Ollama usually works).

---

## 🐳 Docker Infrastructure

The Docker setup is designed for **local network usage**, allowing you to use the Reader Helper on mobile devices or other computers on your LAN while connecting to a locally running LLM (Ollama) on your host machine.

### 1. Networking (`host.docker.internal`)
*   **Challenge**: Docker containers are isolated. They cannot normally "see" `localhost:11434` on your Windows host.
*   **Solution**: We map the host gateway in `docker-compose.yml`.
    ```yaml
    extra_hosts:
      - "host.docker.internal:host-gateway"
    ```
*   **Usage**: The proxy configuration in `vite.config.ts` or the API service must point to `http://host.docker.internal:11434` when running inside Docker.

### 2. Nginx
*   The `Dockerfile` builds the static assets and serves them via **Nginx**.
*   This generic server handles SPA routing (redirecting 404s to `index.html`) to ensure the React app loads correctly.

---

## ⚡ State Management (Zustand)

We use **Zustand** for granular state management to avoid the "Context Hell" and excessive re-renders associated with complex React Context usage.

### 1. `useReaderStore`
**Responsibility**: Manages the core reading experience configuration.
*   **State**: `tokens`, `fontSize`, `currentPage`, `selectionMode` (Word/Sentence).
*   **Key Logic**:
    *   Pagination calculation.
    *   Selection grouping logic (handling contiguous selections).

### 2. `useTranslationStore`
**Responsibility**: Handles all translation-related data.
*   **State**:
    *   `hoveredIndex`: The global index of the word currently hovered.
    *   `hoverTranslation`: The translation string for the hovered word.
    *   `selectionTranslations`: Cached translations for clicked text.
*   **Optimization**: Contains complex logic for debouncing hover fetches to prevent API spam.

### 3. `useAudioStore`
**Responsibility**: Manages text-to-speech synchronization.
*   **State**: `isPlaying`, `currentWordIndex` (for karaoke highlighting), `playbackRate`.
*   **Key Logic**: Syncs browser audio events with the visual reader state.

---

## 🚀 Performance Optimizations

The Reader view renders hundreds of interactive token components. Optimizing this is critical for responsiveness.

### 1. Memoization Strategy
*   **`ReaderToken`**: Wrapped in `React.memo`. It only re-renders if its specific props change.
*   **`ReaderTextContent`**: Wrapped in `React.memo`. It acts as a barrier, preventing parent `ReaderView` updates from forcing a re-render of the entire token list.

### 2. "Scoped" Prop Passing
**Problem**: Subscribing every `ReaderToken` directly to the global store causes all tokens to re-render whenever *any* state changes (e.g., hovering a single word).
**Solution**:
*   `ReaderTextContent` subscribes to the stores (e.g., `hoveredIndex`).
*   It calculates derived state for each token (e.g., `isHovered = globalIndex === hoveredIndex`).
*   It passes **primitive** props or **stable objects** to `ReaderToken`.
*   **Crucial Fix**: The `hoverTranslation` string is only passed to the *specific hovered token*. All other tokens receive `undefined`. This ensures `React.memo` sees no changes for 99% of the tokens, preventing massive re-renders.

### 3. Stable Callbacks
*   **Events**: Handlers like `onHover` and `onClick` are stabilized using `useCallback` in parent components.
*   **Ref-based Debouncing**: In `useTranslation`, we use `useRef` to track the `lastHoveredIndex` instantly without triggering React state updates until necessary. This allows for "sticky" hover behavior and prevents flickering.

### 4. CSS Optimizations
*   **Containment**: Styles use strict containment where possible to minimize browser layout recalculation scope.
*   **Hardware Acceleration**: GPU-accelerated properties (transform, opacity) are used for hover animations.

---

## 📂 Key File Structure

```
src/presentation/features/reader/
├── components/
│   ├── ReaderView.tsx        # Main Layout Orchestrator
│   ├── ReaderTextContent.tsx # Optimized Token Renderer (The "List")
│   └── ReaderToken.tsx       # Individual Word/Token (Memoized)
├── hooks/
│   ├── useTranslation.ts     # Hover/Fetch Logic
│   ├── useHighlighting.ts    # Visual range calculation (O(1) lookups)
│   └── useReader.ts          # Core reader logic
└── store/
    ├── useReaderStore.ts
    ├── useTranslationStore.ts
    └── useAudioStore.ts
```

## 🛠 Adding New Features

1.  **State**: Determine which store the state belongs to. Do not add state to `ReaderView` if it affects individual tokens.
2.  **Logic**: Implement logic in a custom hook or store action.
3.  **Rendering**:
    *   If it affects all tokens, update `ReaderTextContent` props.
    *   If it affects one token, pass it as a prop to `ReaderToken` and ensure it is undefined/false for others to preserve memoization.
