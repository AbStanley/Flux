import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultClient, getAuthToken } from '../../../../infrastructure/api/api-client';
import { getSocket } from '../../../../infrastructure/api/socket';

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

async function streamViaNdjson(
    messages: { role: string; content: string }[],
    model: string,
    appendToken: (token: string, fullContent: string) => string,
) {
    const baseUrl = await defaultClient.getActiveBaseUrl();
    const token = await getAuthToken();
    const response = await fetch(
        `${baseUrl}/api/chat`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ model: model || undefined, messages, stream: true }),
        },
    );
    if (!response.ok) throw new Error(`Chat failed: ${response.status}`);
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream');
    const decoder = new TextDecoder();
    let fullContent = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                const token = parsed?.message?.content ?? '';
                fullContent = appendToken(token, fullContent);
            } catch { /* skip */ }
        }
    }
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

                const ollamaMessages = updatedMessages.map((m) => ({
                    role: m.role,
                    content: m.content,
                }));

                const appendToken = (token: string, fullContent: string) => {
                    const updated = fullContent + token;
                    set((state) => {
                        const msgs = [...state.messages];
                        msgs[msgs.length - 1] = { role: 'assistant', content: updated };
                        return { messages: msgs };
                    });
                    return updated;
                };

                try {
                    // Try WebSocket first
                    const socket = await getSocket();
                    if (socket.connected) {
                        await new Promise<void>((resolve, reject) => {
                            let fullContent = '';

                            const onToken = (data: { content: string }) => {
                                fullContent = appendToken(data.content, fullContent);
                            };
                            const onDone = () => { cleanup(); resolve(); };
                            const onError = (data: { error: string }) => { cleanup(); reject(new Error(data.error)); };

                            const cleanup = () => {
                                socket.off('chat:token', onToken);
                                socket.off('chat:done', onDone);
                                socket.off('chat:error', onError);
                            };

                            socket.on('chat:token', onToken);
                            socket.on('chat:done', onDone);
                            socket.on('chat:error', onError);
                            socket.emit('chat', { model: model || undefined, messages: ollamaMessages });
                        });
                    } else {
                        // Fallback to NDJSON
                        await streamViaNdjson(ollamaMessages, model, appendToken);
                    }
                } catch (e) {
                    // If WebSocket fails, try NDJSON fallback
                    try {
                        let fullContent = '';
                        const msgs = get().messages;
                        const lastMsg = msgs[msgs.length - 1];
                        if (lastMsg?.role === 'assistant') fullContent = lastMsg.content;
                        if (!fullContent) {
                            await streamViaNdjson(ollamaMessages, model, appendToken);
                        } else {
                            throw e; // Already had partial content from WS, surface the error
                        }
                    } catch (fallbackErr) {
                        const msg = fallbackErr instanceof Error ? fallbackErr.message : 'Failed to send message';
                        set({ error: msg });
                    }
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
