# Ideas for What to Build Next

  Here are some directions based on gaps and natural extensions of what you have:

  High-Impact Features

  1. Spaced Repetition System (SRS) -- You have decks, words, and games. Add SM-2 or FSRS scheduling
   to surface words at optimal review intervals. This is the #1 missing piece for serious language
  learners.
  2. Conversation Practice -- A chat mode where the user has a back-and-forth conversation with the
  LLM in the target language, with inline corrections and vocabulary suggestions.
  3. Reading Progress & Statistics Dashboard -- Track words read, time spent, vocabulary growth over
   time, game scores history. Visualize learning streaks with charts.

  Reader Enhancements

  1. Bookmarks & Reading Sessions -- Save reading position per document so users can resume where
  they left off across sessions.
  2. Full Library View -- A landing page to manage imported documents (PDFs, EPUBs, pasted texts) as
   a personal library with thumbnails and last-read timestamps.
  3. Paragraph-Level Translation -- In addition to word/phrase, allow selecting a full paragraph for
   a summary translation or explanation.

  Learning Mode Expansions

  1. Flashcard Review Mode -- Classic flashcard flip interface (separate from the games), using the
  SRS scheduling above.
  2. Cloze Deletion Game -- Show a sentence with a blank and let the user fill in the missing word  
  from context.
  3. Listening Comprehension -- Play audio of a passage and quiz the user on content, combining TTS
  and the game engine.

  Quality of Life

  1. Multi-User Support -- You have auth already. Allow switching between users with separate
  libraries, decks, and progress.
  2. Offline Model Management UI -- A settings panel to pull/delete Ollama models directly from the
   app instead of requiring the terminal.
  3. Mobile-Responsive Layout -- Optimize the reader and games for tablet/phone screens for reading
   on the go via LAN.

  Technical / Infrastructure

  1. Cloud Provider Toggle -- The architecture already supports it. Add an OpenAI/Anthropic backend
   option in settings for users without GPU hardware for Ollama.
  2. WebSocket Streaming -- Replace NDJSON polling with WebSockets for lower latency on
  generation/translation.
  3. PWA Support -- Add a service worker and manifest to make the web app installable as a
  desktop/mobile app.
