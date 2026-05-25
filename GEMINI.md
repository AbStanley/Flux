# GEMINI - Agentic Architectural Brain (Local)

> [!IMPORTANT]
> **Project Specifics**: For project-specific rules, philosophy, tech stack details, and directory structure, refer to the living document:
> **[PROJECT_RULES.md](./docs/ARCHITECTURE.md)** (Architecture Overview) and the rules below.

---

## 1. Clean Architecture & Scalability

We follow a strict **Clean Architecture** approach to ensure the system is testable, maintainable, and independent of frameworks/UI details.

### 1.1 The Dependency Rule (Universal)
**Source code dependencies must only point inward.**
-   **Inner Circles (Domain)**: Know nothing about outer circles (Infrastructure/UI).
-   **Data Transfer**: Data crossing boundaries should be simple structures (DTOs), not complex objects (like generic `ORM` entities).

### 1.2 Architectural Layers
1.  **Domain (Entities)**: Core business objects (e.g., words, decks, user states). Pure logic. No dependencies.
2.  **Application (Use Cases/Services)**: Orchestrates data flow (e.g., words management, AI text-explanation streaming).
3.  **Interface Adapters (Controllers/Presenters)**: Converts data formats (e.g., NestJS Controllers, custom React hooks).
4.  **Infrastructure (Databases/Frameworks)**: The implementation details (Vite, Prisma, NestJS, Ollama, Docker).

---

## 2. Senior Design Patterns

Apply these patterns to solve repeated design problems. Do not reinvent the wheel.

### 2.1 Creational Patterns
-   **Factory Method**: Use to create objects without exposing the instantiation logic to the client.
    -   *Use Case*: Creating different types of `ReaderTokens` (Word, Phrase, Punctuation) based on text analysis.
-   **Singleton**: Use sparingly. Primarily for stateless infrastructure services.
    -   *Use Case*: `DatabaseConnection`, `LoggerService`.
-   **Builder**: Constructing complex objects step-by-step.
    -   *Use Case*: Building complex AI Prompts or Config objects.

### 2.2 Structural Patterns
-   **Facade**: **CRITICAL**. Provide a unified interface to a set of interfaces in a subsystem.
    -   *Use Case*: The `OllamaService` acts as a facade, hiding the complexity of HTTP requests, streaming, and error handling from the UI.
-   **Adapter**: Convert the interface of a class into another interface clients expect.
    -   *Use Case*: Wrapping a 3rd party library (like a TTS engine) so our app depends on `IAudioProvider`, not the specific library.
-   **Composite**: Compose objects into tree structures to represent part-whole hierarchies.
    -   *Use Case*: Rendering a `Paragraph` which is composed of `Sentences`, which are composed of `Tokens`.

### 2.3 Behavioral Patterns
-   **Strategy**: **CRITICAL**. Define a family of algorithms, encapsulate each one, and make them interchangeable.
    -   *Use Case*: Swapping between `OllamaLLM` and `OpenAILLM` without changing the rest of the app.
    -   *Use Case*: Swapping between `DatabaseStrategy`, `AnkiStrategy`, and `AiStrategy` for Game Content.
-   **Observer**: Define a one-to-many dependency so that when one object changes state, all its dependents are notified.
    -   *Use Case*: React Components "observing" a Zustand store.
-   **Command**: Encapsulate a request as an object.
    -   *Use Case*: Implementing "Undo/Redo" functionality.

---

## 3. Technology Stack & Directory Rules

### Frontend (`apps/client`)
-   **Framework**: React 19 (Vite)
-   **Language**: TypeScript
-   **Styling**: TailwindCSS (Utility-first) + CSS Modules
-   **State**: Zustand (Stores)

### Backend (`apps/server`)
-   **Framework**: NestJS 11 (Express adapter)
-   **Language**: TypeScript
-   **Database**: PostgreSQL
-   **ORM**: Prisma
-   **AI**: Ollama (Local LLM) via `ollama` js library

### 3.1 File Limits & Rules
-   > [!IMPORTANT]
    > **Max File Size**: **200 Lines**. If a file exceeds this, you **MUST** refactor it immediately.
-   **Cross-App Imports**: **FORBIDDEN**. `client` cannot import from `server`. They talk via HTTP/JSON only.
-   **Refs in React 19**: Eliminate `forwardRef`. Pass `ref` as a standard prop.
-   **Context in React 19**: Use `<Context>` provider directly instead of `<Context.Provider>`.

---

## 4. Interaction Protocol: Smart Rubber Duck
The user prefers a 'Smart Rubber Duck' approach to problem-solving.
-   **Analyze First**: Break down the 'What', 'Why', 'Alternatives', 'Optimizations', and 'Architecture'.
-   **Explain**: Teach the concepts and high-level details.
-   **Goal**: Facilitate learning and mental tracking, not just solution delivery.
