import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultClient } from '../../../../infrastructure/api/api-client';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ConversationState {
    status: 'setup' | 'chatting';
    messages: ChatMessage[];
    isStreaming: boolean;
    error: string | null;

    // Config (persisted)
    targetLanguage: string;
    nativeLanguage: string;
    topic: string;
    model: string;

    // Actions
    setConfig: (updates: Partial<Pick<ConversationState, 'targetLanguage' | 'nativeLanguage' | 'topic' | 'model'>>) => void;
    startConversation: () => void;
    sendMessage: (text: string) => Promise<void>;
    reset: () => void;
}

function buildSystemPrompt(targetLang: string, nativeLang: string, topic: string): string {
    return `You are a strict but friendly ${targetLang} language tutor in a conversation practice session. Follow these rules EXACTLY:

CORRECTIONS — THIS IS YOUR #1 PRIORITY:
- You MUST catch and correct EVERY mistake the user makes — grammar, spelling, vocabulary, word order, accent marks, verb conjugation, gender agreement, preposition usage — absolutely everything.
- For EACH mistake, output EXACTLY this format on its own line BEFORE your conversational reply:
  [correction: "what the user wrote wrong" → "the correct form" | brief explanation in ${nativeLang}]
- If the user makes multiple mistakes, list EACH correction on its own line.
- Never skip a mistake. Even small ones matter for learning.

VOCABULARY:
- In each reply, suggest one useful word or phrase related to the conversation using EXACTLY:
  [vocab: "${targetLang} word/phrase" — ${nativeLang} meaning]

CONVERSATION:
- After all corrections and vocab, continue the conversation naturally in ${targetLang}.
- Keep your conversational reply to 2-3 sentences.
- Ask a follow-up question to keep the conversation going.
- Adjust complexity to the user's level.
- Topic: ${topic || 'free conversation — talk about anything'}.

FIRST MESSAGE:
- Greet the user warmly in ${targetLang} and ask an opening question about the topic.
- Include one [vocab: ...] suggestion to start.`;
}

export const useConversationStore = create<ConversationState>()(
    persist(
        (set, get) => ({
            status: 'setup',
            messages: [],
            isStreaming: false,
            error: null,
            targetLanguage: 'Spanish',
            nativeLanguage: 'English',
            topic: '',
            model: '',

            setConfig: (updates) => set(updates),

            startConversation: () => {
                const { targetLanguage, nativeLanguage, topic } = get();
                const systemMessage: ChatMessage = {
                    role: 'system',
                    content: buildSystemPrompt(targetLanguage, nativeLanguage, topic),
                };
                set({
                    status: 'chatting',
                    messages: [systemMessage],
                    error: null,
                });
                // Trigger initial assistant greeting
                get().sendMessage('');
            },

            sendMessage: async (text: string) => {
                const { messages, model, isStreaming } = get();
                if (isStreaming) return;

                // Add user message (skip for initial greeting trigger)
                const updatedMessages = text
                    ? [...messages, { role: 'user' as const, content: text }]
                    : messages;

                // Add placeholder assistant message
                const withAssistant = [
                    ...updatedMessages,
                    { role: 'assistant' as const, content: '' },
                ];

                set({ messages: withAssistant, isStreaming: true, error: null });

                try {
                    // Build Ollama messages payload (exclude empty assistant placeholder)
                    const ollamaMessages = updatedMessages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    }));

                    const response = await fetch(
                        `${defaultClient.getBaseUrl()}/api/chat`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                model: model || undefined,
                                messages: ollamaMessages,
                                stream: true,
                            }),
                        },
                    );

                    if (!response.ok) {
                        throw new Error(`Chat failed: ${response.status}`);
                    }

                    const reader = response.body?.getReader();
                    if (!reader) throw new Error('No response stream');

                    const decoder = new TextDecoder();
                    let fullContent = '';

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n').filter(Boolean);

                        for (const line of lines) {
                            try {
                                const parsed = JSON.parse(line);
                                const token = parsed?.message?.content ?? '';
                                fullContent += token;

                                // Update the last message in place
                                set((state) => {
                                    const msgs = [...state.messages];
                                    msgs[msgs.length - 1] = {
                                        role: 'assistant',
                                        content: fullContent,
                                    };
                                    return { messages: msgs };
                                });
                            } catch {
                                // skip malformed chunks
                            }
                        }
                    }
                } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Failed to send message';
                    set({ error: msg });
                } finally {
                    set({ isStreaming: false });
                }
            },

            reset: () =>
                set({
                    status: 'setup',
                    messages: [],
                    isStreaming: false,
                    error: null,
                }),
        }),
        {
            name: 'flux-conversation-storage',
            partialize: (state) => ({
                targetLanguage: state.targetLanguage,
                nativeLanguage: state.nativeLanguage,
                topic: state.topic,
                model: state.model,
            }),
        },
    ),
);
