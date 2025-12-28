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
- **Styling**: Vanilla CSS (CSS Modules or standard CSS with Variables). *Focus on maintainability and modern CSS features (Grid, Flexbox, Variables).*
- **State Management**: React Context + Hooks (Clean and simple for MVP, scalable enough).

## 4. Design & Aesthetics (The "Premium" Look)
The UI must be **clean**, **minimalist**, and **animated**.
- **Typography**: Use high-quality sans-serif fonts (e.g., *Inter*, *Outfit*). Readable and elegant.
- **Colors**: Deep, harmonious palettes. Glassmorphism (blur effects) for overlays.
- **Micro-interactions**: Hover effects, smooth transitions for translation popups, satisfying clicks.
- **Layout**: Distraction-free reading environment.

## 5. Directory Structure
```
src/
  ├── core/             # Core interfaces and shared logic
  │   ├── interfaces/
  │   └── models/
  ├── infrastructure/   # Concrete implementations of core interfaces
  │   ├── ai/
  │   └── file-system/
  ├── presentation/     # UI Components and Pages
  │   ├── components/   # Shared UI components (Buttons, Modals)
  │   └── features/     # Feature-specific components (Reader, Settings)
  ├── services/         # Application logic (Service classes/functions)
  └── styles/           # Global styles and themes
```

## 6. Development Rules & Standards
### 6.1 Code Implementation Rules
- **Limit File Size**: **NO FILE** should exceed **250 lines**. If a file grows larger, refactor and split it into smaller, modular sub-components or utility files.
- **No hard dependencies**: UI components should not instantiate services directly.
- **Type safety**: Strict TypeScript usage. No `any` unless absolutely necessary.
- **Immutability**: Prefer immutable data structures.
- **Testing**: Code should be testable by design (thanks to DI).

### 6.2 Best Practices (Senior Approach)
- **Avoid Bad Practices**: Do not write spaghetti code, magic numbers, or tightly coupled components.
- **Modern Syntax**: Use modern ES6+ features (arrow functions, destructuring, spread operator) and modern React patterns (Hooks, Functional Components).
- **Secure**: Sanitize inputs where necessary (though React handles most XSS). Avoid storing sensitive keys in client-side code.
- **Scalable**: Design components to be reusable. Isolate state where it belongs.
- **Efficient**: Minimize re-renders. Use `useMemo` and `useCallback` appropriately (but pragmatically).
- **Pragmatic**: Don't over-engineer. Solve the problem at hand with the simplest clean solution.

## 7. Living Document Policy
This file (`gemini.md`) is a **living document**.
- **Must be Updated**: It should be modified by the AI assistant as the project evolves, architecture changes, or new patterns are adopted.
- **Source of Truth**: Always consult this file first. Re-read and update it after significant modifications to ensure it reflects the current state of the codebase.
