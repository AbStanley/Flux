# Reader Helper

A premium reading assistant application built with React, TypeScript, and Ollama.

## 📖 Current Modifications (v1.2)

### Logic
The application core logic revolves around text tokenization and interaction.
1. **Input**: User pastes text or generates it via AI.
2. **Processing**: Text is split into tokens (words/whitespace), preserving structure.
3. **Interaction**:
    - **Click**: Users click words to add them to a selection set. Contiguous selections form groupings.
    - **Hover**: Users hover over words to get instant "dictionary-style" translations.
4. **Translation**:
    - **Context-Aware**: Translations use surrounding context (sentences) to ensure accuracy.
    - **Target Language**: Users select a target language (e.g., Spanish), and all AI prompts are tailored to this target.
    - **Provider**: Defaults to **Ollama** (Local LLM) for privacy and zero-cost, with a fallback Mock mode.

### 🏗 Architecture & Performance
> **[Read the full Architecture Guide](./ARCHITECTURE.md)** for a deep dive into state management, rendering strategies, and optimizations.

We follow **Clean Architecture** principles backed by **Zustand** for high-performance state management.

- **Presentation Layer** (`src/presentation`):
    - **Optimized Rendering**: `ReaderToken` and `ReaderTextContent` are heavily optimized with `React.memo` and scoped prop passing to ensure 60fps performance even with large texts.
    - **State**: Granular Zustand stores (`useReaderStore`, `useTranslationStore`, `useAudioStore`) prevent unnecessary re-renders.
- **Infrastructure Layer** (`src/infrastructure`):
    - **AI Services**: Concrete implementations of `IAIService`.
        - `OllamaService`: Connects to local Ollama instance.

### Features
- **Clean, Premium UI**: Glassmorphism design, smooth transitions, distraction-free reading.
- **Unified Design System**: Built with **shadcn/ui** and **Tailwind CSS** for consistency and accessibility.
- **High Performance**: Optimized rendering engine ensuring zero lag on hover/interaction.
- **MCP Server Ready**: Configured for AI assistants (VS Code/Cursor) to browse and install components.
- **Local AI Integration**: Seamless connection to local Ollama models.
- **Smart Translation**: 
    - Hover and selection-based translations.
    - **Non-blocking Details Panel**: Detailed translation insights in a non-intrusive sidebar (Desktop) or bottom sheet (Mobile).
- **Audio Reading**:
    - **Natural TTS**: Reads text aloud using browser synthesis.
    - **Karaoke Highlighting**: Highlights words in real-time as they are spoken.
    - **Scrubbing Timeline**: Interactive slider to seek and jump to any part of the text.
- **Language Controls**: Top-level source/target language selection.

### Source Tree
```
src/
├── core/                  # Interfaces & Models
│   └── interfaces/        # IAIService contract
├── infrastructure/        # External Communication
│   └── ai/                # OllamaService & MockAIService
├── presentation/          # UI Layer
│   ├── components/        # Shared components
│   ├── contexts/          # DI Container (ServiceContext)
│   ├── features/
│   │   ├── controls/      # ControlPanel (Input/Settings)
│   │   └── reader/        # ReaderView (Main reading area)
│   ├── App.tsx            # Root & Global State
│   └── main.tsx           # Entry Point
└── styles/                # Global CSS & Variables
```

### Diagrams

#### Core Logic Flow
```mermaid
graph TD
    User[User] -->|Input Text| CP[Control Panel]
    User -->|Select Target Lang| CP
    CP -->|Set Global State| App[App State]
    App -->|Props| RV[Reader View]
    
    subgraph Reader Interaction
        RV -->|Tokenize| Tokens[Tokens Array]
        User -->|Click Word| Select[Selection Logic]
        User -->|Hover Word| Hover[Hover Logic]
        User -->|Play/Scrub| Audio[Audio Store]

        Select -->|Form Groups| Grouping[Group Logic]
        Grouping -->|Request Translation| Service[AI Service]
        Audio -->|Highlight| Tokens
    end
    
    Service -->|Ollama API| LLM[Local LLM]
    LLM -->|Translation| Service
    Service -->|Update UI| RV
```

#### Architecture Layers
```mermaid
classDiagram
    class Presentation {
        +App
        +ReaderView
        +ControlPanel
    }
    class Domain {
        <<interface>>
        +IAIService
    }
    class Infrastructure {
        +OllamaService
        +MockAIService
    }
    
    Presentation ..> Domain : Depends On
    Infrastructure --|> Domain : Implements
    Presentation --> Infrastructure : Injected via Context
```

## 🛠 Setup & Usage
1. **Prerequisites**: [Ollama](https://ollama.ai/) installed and running (`ollama serve`).
2. **Install**: `npm install`
3. **Run**: `npm run dev`
4. **Build**: `npm run build`
