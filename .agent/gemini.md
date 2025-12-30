# Reader Helper - Project Guidelines & Architecture

## 1. Project Philosophy
This project aims to be a **premium** reading assistant. High-quality code implementation and a high-quality user experience are equally important.

## 2. Architecture & Design Patterns
We strictly adhere to **SOLID** principles to ensure the codebase remains maintainable and scalable.
- **Modular Development**: Each feature or component should be self-contained and modular.
- **Senior Approach**: Code must be modern, secure, scalable, efficient, pragmatic, and clean.

### 2.1 Clean Architecture Layers
The application should be structured into clear layers:
- **Presentation Layer**: UI Components, Hooks, View Models. *Responsible only for displaying data and handling user interactions.*
- **Domain/Business Logic Layer**: Services, Models, State Management. *Responsible for the core logic (e.g., maintaining selection state, orchestrating translation).*
- **Data/Infrastructure Layer**: API Clients (Ollama, LM Studio), File Parsers. *Responsible for talking to the outside world.*

### 2.2 Dependency Injection
Use **Dependency Injection** (via React Context or Hook factories) to decouple the UI from specific implementations.
*Example:* The component requesting a translation should depend on an `ITranslationService` interface, allowing us to swap between `OllamaTranslationService`, `OpenAITranslationService`, or `MockTranslationService` easily.

## 3. Technology Stack
- **Framework**: React (Vite) + TypeScript
- **Styling**: **Tailwind CSS** + **shadcn/ui** (MCP Configured). *Focus on maintainability, scalability, and premium design tokens.*
- **State Management**: **Zustand** (Global Store) + Hooks (Connector pattern). *Single Source of Truth.*
    - `useReaderStore`: Manages text content, pagination, and selection.
    - `useAudioStore`: Manages TTS playback, voice selection, and timeline scrubbing (via token index seeking).

## 4. Design & Aesthetics (The "Premium" Look)
The UI must be **clean**, **minimalist**, and **animated**.
- **Typography**: Use high-quality sans-serif fonts (e.g., *Inter*, *Outfit*). Readable and elegant.
- **Colors**: Deep, harmonious palettes. Glassmorphism (blur effects) for overlays.
- **Micro-interactions**: Hover effects, smooth transitions for translation popups, satisfying clicks.
- **Responsive Layout**:
    - **Desktop**: Side-by-side flex layout for panels (e.g., Translation Details) to avoid obscuring content.
    - **Mobile**: Bottom sheet overlays for maximum reachability.
- **Layout**: Distraction-free reading environment.

## 5. Directory Structure
```
src/
  ├── core/             # Core interfaces and shared logic
  │   ├── constants/    # Shared constants (Languages, Configs)
  │   ├── interfaces/
  │   └── models/
  ├── infrastructure/   # Concrete implementations of core interfaces
  │   ├── ai/
  │   └── file-system/
  ├── presentation/     # UI Components and Pages
  │   ├── components/   # Shared UI components (Buttons, Modals)
  │   ├── features/     # Feature-specific components (Reader, Settings)
  │   │   ├── components/ # Sub-components (e.g. RichInfoPanel, PlayerControls)
  │   │   ├── hooks/      # View Models / Connectors (e.g. useTranslation)
  │   │   └── store/      # Zustand Stores (useReaderStore, useAudioStore)

  ├── services/         # Application logic (Service classes/functions)
  └── styles/           # Global styles and themes
```

## 6. Development Rules & Standards
### 6.1 Code Implementation Rules
- **Limit File Size**: **NO FILE** should exceed **200 lines**. If a file grows larger, refactor and split it into smaller, modular sub-components or utility files.
- **No hard dependencies**: UI components should not instantiate services directly.
- **Type safety**: Strict TypeScript usage. No `any` unless absolutely necessary.
- **Immutability**: Prefer immutable data structures.
- **Testing**: Code should be testable by design (thanks to DI).

### 6.2 Senior Implementation Patterns (Strictly Enforced)

#### State Management
- **Single Source of Truth**: Data belongs in the Store. Hooks and Components are consumers.
- **No Prop-Syncing**: Do not pass props to a hook just to sync them to the store via `useEffect`. Initialize the store at a higher level (e.g., `App.tsx`) and let components consume the store directly.
- **Fat Store, Thin Components**: Move complex business logic (e.g., grouping algorithms, API orchestration) into Store Actions/Thunks. keep UI components purely presentational.
- **Avoid Derived State**: Do not store state that can be calculated on-the-fly from other state variables. Calculate it in the selector or the hook.

#### Design Patterns
**React Specific:**
- **Slot Pattern**: Use for Layouts (e.g., `FocusLayout`) to inject content components, ensuring loose coupling.
- **Compound Components**: Use for complex UI elements (like `Select`, `Tabs`) where parent and child components communicate implicitly.
- **Container/Presentation**: Separate data fetching/state logic (Container) from rendering logic (Presentation).
- **Custom Hooks**: Encapsulate logic and side effects; act as the "Controller" in MVC terms.
- **Context/Provider**: Use for dependency injection of services or global themes, but avoid for rapidly changing state (use Zustand).

**General Object-Oriented/Functional:**
- **Strategy Pattern**: Use for interchangeable algorithms, such as switching between different AI Translation Services (`OllamaService` vs `OpenAIService`) behind a common interface.
- **Adapter Pattern**: Use to adapt external libraries or APIs (e.g., browser `SpeechSynthesis`) to our domain interfaces (`IAudioService`).
- **Facade Pattern**: Use custom hooks or service aggregators to provide a simplified interface to a complex subsystem (e.g., `useReader` abstracts away the complexity of the store and calculation logic).
- **Singleton**: Service instances (e.g., API clients) are singletons enforced by the module system.
- **Observer Pattern**: Utilized by Zustand for state subscription. Components subscribe to slice updates.

#### Code Quality & Comments
- **Clean Comments**: Comments should explain **WHY**, not *WHAT*.
- **No Thought Process or Markers**: ABSOLUTELY NO "thought process" commentary, `// new`, `// fix`, or `// todo` markers. Remove them immediately after writing. The final code must be clean and look like it was written by a human expert.
- **Self-Documenting Code**: Variable and function names should be descriptive enough to minimize the need for comments.

#### Error Handling
- **Visibility**: **NEVER** suppress errors with a simple `console.error` in a catch block. All errors must be exposed to the user at the UI level (e.g., via toast notifications, inline error messages, or alert dialogs). Failures must be visible.
- **Graceful Failure**: When an action fails (e.g., translation), the UI should clearly reflect the failure state rather than failing silently or crashing.

## 7. Living Document Policy
This file (`gemini.md`) is a **living document**.
- **Must be Updated**: It should be modified by the AI assistant as the project evolves, architecture changes, or new patterns are adopted.
- **Source of Truth**: Always consult this file first. Re-read and update it after significant modifications to ensure it reflects the current state of the codebase.
