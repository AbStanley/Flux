# What to Build Next

## High-Impact Features

- [x] **Spaced Repetition System (SRS)** -- SM-2 algorithm, review UI, stats, language filters
- [ ] **Conversation Practice** -- Chat mode with LLM in target language, inline corrections and vocabulary suggestions
- [x] **Reading Progress & Statistics Dashboard** -- Activity chart, SRS overview, language breakdown, streak tracking

## Reader Enhancements

- [x] **Bookmarks & Reading Sessions** -- Save reading position, auto-save on page change, resume from library
- [x] **Full Library View** -- Document library with EPUB chapter TOC, click to load specific chapters, progress tracking
- [ ] **Paragraph-Level Translation** -- Select a full paragraph for summary translation or explanation

## Learning Mode Expansions

- [x] **Flashcard Review Mode** -- SRS review page with flip-to-reveal cards (built into SRS feature)
- [x] **Cloze Deletion Game** -- Fill-in-the-blank from context sentences, hints, 20s timer
- [ ] **Listening Comprehension** -- Play audio of a passage and quiz the user on content

## Quality of Life

- [ ] **Multi-User Support** -- Switching between users with separate libraries, decks, and progress
- [ ] **Offline Model Management UI** -- Settings panel to pull/delete Ollama models from the app
- [ ] **Mobile-Responsive Layout** -- Optimize reader and games for tablet/phone via LAN

## Technical / Infrastructure

- [ ] **Cloud Provider Toggle** -- OpenAI/Anthropic backend option in settings for users without GPU
- [ ] **WebSocket Streaming** -- Replace NDJSON polling with WebSockets for lower latency
- [ ] **PWA Support** -- Service worker and manifest to make the web app installable

## Bug Fixes / Polish (from this session)

- [x] **SRS Hard button quality** -- Fixed: sends quality=2 (lapse) instead of 3
- [x] **SRS auth check** -- Review endpoint verifies word ownership
- [x] **SRS language filters** -- Dropdowns on SRS review page
- [x] **Cloze smart word detection** -- Detects which word appears in context regardless of swap direction
- [x] **Timer bar overflow** -- Normalized for cloze's 20s timer
- [x] **Stats activity chart** -- SVG bar chart with pagination (30-day windows)
- [x] **EPUB full text storage** -- All chapters saved on import so you can switch chapters from library
- [x] **Body size limit** -- Increased to 50MB for large EPUB imports
