import { useState, useRef, useEffect } from 'react';
import { useConversationStore, type ChatMessage } from './store/useConversationStore';
import { useServices } from '../../contexts/ServiceContext';
import { Button } from '../../components/ui/button';
import { MessageCircle, Send, RotateCcw, Loader2, BookmarkPlus, Check } from 'lucide-react';
import { wordsApi } from '../../../infrastructure/api/words';

export function ConversationPage() {
    const { status } = useConversationStore();

    if (status === 'setup') return <SetupScreen />;
    return <ChatScreen />;
}

function SetupScreen() {
    const { targetLanguage, nativeLanguage, topic, model, setConfig, startConversation } =
        useConversationStore();
    const { aiService } = useServices();
    const [models, setModels] = useState<string[]>([]);

    useEffect(() => {
        aiService.getAvailableModels().then(setModels);
    }, [aiService]);

    useEffect(() => {
        if (!model && aiService.getModel()) {
            setConfig({ model: aiService.getModel() });
        }
    }, [model, aiService, setConfig]);

    return (
        <div className="container py-8 max-w-xl mx-auto space-y-8 animate-in fade-in">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Conversation Practice</h2>
                <p className="text-muted-foreground">Chat with an AI partner in your target language.</p>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <label className="space-y-1.5">
                        <span className="text-sm font-medium text-foreground">I speak</span>
                        <input
                            type="text"
                            value={nativeLanguage}
                            onChange={(e) => setConfig({ nativeLanguage: e.target.value })}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-sm font-medium text-foreground">I'm learning</span>
                        <input
                            type="text"
                            value={targetLanguage}
                            onChange={(e) => setConfig({ targetLanguage: e.target.value })}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </label>
                </div>

                <label className="space-y-1.5 block">
                    <span className="text-sm font-medium text-foreground">Topic (optional)</span>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setConfig({ topic: e.target.value })}
                        placeholder="e.g. ordering food, weekend plans, travel..."
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </label>

                {models.length > 0 && (
                    <label className="space-y-1.5 block">
                        <span className="text-sm font-medium text-foreground">Model</span>
                        <select
                            value={model}
                            onChange={(e) => setConfig({ model: e.target.value })}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {models.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            <div className="flex justify-center">
                <Button
                    size="lg"
                    onClick={startConversation}
                    disabled={!targetLanguage || !nativeLanguage}
                    className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 gap-2"
                >
                    <MessageCircle className="w-4 h-4" />
                    Start Conversation
                </Button>
            </div>
        </div>
    );
}

function ChatScreen() {
    const { messages, isStreaming, error, sendMessage, reset, targetLanguage, nativeLanguage } =
        useConversationStore();
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || isStreaming) return;
        setInput('');
        sendMessage(text);
    };

    const visibleMessages = messages.filter((m) => m.role !== 'system');

    return (
        <div className="flex flex-col h-[calc(100dvh-65px)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-foreground">Conversation Practice</h2>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {targetLanguage}
                    </span>
                </div>
                <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    New
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {visibleMessages.map((msg, i) => (
                    <MessageBubble
                        key={i}
                        message={msg}
                        targetLanguage={targetLanguage}
                        nativeLanguage={nativeLanguage}
                    />
                ))}

                {isStreaming && visibleMessages[visibleMessages.length - 1]?.content === '' && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm pl-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Typing...
                    </div>
                )}

                {error && (
                    <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
                        {error}
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t px-4 py-3">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isStreaming}
                        className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        autoFocus
                    />
                    <Button type="submit" size="default" disabled={isStreaming || !input.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}

function MessageBubble({ message, targetLanguage, nativeLanguage }: {
    message: ChatMessage;
    targetLanguage: string;
    nativeLanguage: string;
}) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                    ${isUser
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
            >
                {isUser ? (
                    message.content
                ) : (
                    <FormattedContent
                        content={message.content}
                        targetLanguage={targetLanguage}
                        nativeLanguage={nativeLanguage}
                    />
                )}
            </div>
        </div>
    );
}

// ─── Parsed token types ──────────────────────────────

interface CorrectionToken {
    kind: 'correction';
    wrong: string;
    correct: string;
    explanation: string;
}

interface VocabToken {
    kind: 'vocab';
    term: string;
    meaning: string;
}

interface TextToken {
    kind: 'text';
    value: string;
}

type Token = CorrectionToken | VocabToken | TextToken;

function parseContent(content: string): Token[] {
    const tokens: Token[] = [];
    // Match [correction: "wrong" → "correct" | explanation] and [vocab: "term" — meaning]
    const regex = /\[(correction|vocab):\s*(.+?)\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            tokens.push({ kind: 'text', value: content.slice(lastIndex, match.index) });
        }

        const type = match[1];
        const inner = match[2];

        if (type === 'correction') {
            // Parse: "wrong" → "correct" | explanation
            // Also handle without quotes: wrong → correct | explanation
            const arrowMatch = inner.match(
                /[""\u201C]?(.+?)[""\u201D]?\s*(?:→|->|-->)+\s*[""\u201C]?(.+?)[""\u201D]?(?:\s*\|\s*(.+))?$/
            );
            if (arrowMatch) {
                tokens.push({
                    kind: 'correction',
                    wrong: arrowMatch[1].trim(),
                    correct: arrowMatch[2].trim(),
                    explanation: arrowMatch[3]?.trim() || '',
                });
            } else {
                tokens.push({ kind: 'text', value: match[0] });
            }
        } else {
            // Parse: "term" — meaning  OR  term — meaning
            const dashMatch = inner.match(/[""\u201C]?(.+?)[""\u201D]?\s*(?:—|–|-)+\s*(.+)/);
            if (dashMatch) {
                tokens.push({
                    kind: 'vocab',
                    term: dashMatch[1].trim(),
                    meaning: dashMatch[2].trim(),
                });
            } else {
                tokens.push({ kind: 'text', value: match[0] });
            }
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        tokens.push({ kind: 'text', value: content.slice(lastIndex) });
    }

    return tokens;
}

// ─── Formatted content renderer ──────────────────────

function FormattedContent({ content, targetLanguage, nativeLanguage }: {
    content: string;
    targetLanguage: string;
    nativeLanguage: string;
}) {
    if (!content) return null;

    const tokens = parseContent(content);

    return (
        <div className="space-y-1">
            {tokens.map((token, i) => {
                if (token.kind === 'correction') {
                    return (
                        <CorrectionChip
                            key={i}
                            token={token}
                            targetLanguage={targetLanguage}
                            nativeLanguage={nativeLanguage}
                        />
                    );
                }
                if (token.kind === 'vocab') {
                    return (
                        <VocabChip
                            key={i}
                            token={token}
                            targetLanguage={targetLanguage}
                            nativeLanguage={nativeLanguage}
                        />
                    );
                }
                return <span key={i}>{token.value}</span>;
            })}
        </div>
    );
}

// ─── Correction chip with hover popover ──────────────

function CorrectionChip({ token, targetLanguage, nativeLanguage }: {
    token: CorrectionToken;
    targetLanguage: string;
    nativeLanguage: string;
}) {
    const [showPopover, setShowPopover] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useCloseOnOutsideClick(ref, () => setShowPopover(false));

    const handleSave = async () => {
        if (saving || saved) return;
        setSaving(true);
        try {
            await wordsApi.create({
                text: token.correct,
                definition: token.explanation || `Corrected from: "${token.wrong}"`,
                context: `${token.wrong} → ${token.correct}`,
                sourceLanguage: targetLanguage,
                targetLanguage: nativeLanguage,
                sourceTitle: 'Conversation Practice',
            });
            setSaved(true);
        } catch {
            // silently fail
        } finally {
            setSaving(false);
        }
    };

    return (
        <span ref={ref} className="relative inline-block">
            <span
                onClick={() => setShowPopover(!showPopover)}
                className="inline-flex items-center gap-1 bg-red-500/15 text-red-700 dark:text-red-300
                    px-2 py-0.5 rounded-md text-xs font-medium cursor-pointer
                    hover:bg-red-500/25 transition-colors border border-red-500/20 mx-0.5"
            >
                <span className="line-through opacity-60">{token.wrong}</span>
                <span className="mx-0.5">→</span>
                <span className="font-semibold">{token.correct}</span>
            </span>

            {showPopover && (
                <div className="absolute z-50 bottom-full left-0 mb-2 w-64 rounded-lg border bg-popover p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-xs text-muted-foreground">Correction</p>
                                <p className="text-sm">
                                    <span className="line-through text-red-500">{token.wrong}</span>
                                    {' → '}
                                    <span className="font-semibold text-green-600 dark:text-green-400">{token.correct}</span>
                                </p>
                            </div>
                        </div>
                        {token.explanation && (
                            <p className="text-xs text-muted-foreground border-t pt-2">
                                {token.explanation}
                            </p>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saved || saving}
                            className={`w-full flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-md transition-colors
                                ${saved
                                    ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                                }`}
                        >
                            {saved ? (
                                <><Check className="w-3 h-3" /> Saved</>
                            ) : saving ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                            ) : (
                                <><BookmarkPlus className="w-3 h-3" /> Save to Vocabulary</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </span>
    );
}

// ─── Vocab chip with hover popover ───────────────────

function VocabChip({ token, targetLanguage, nativeLanguage }: {
    token: VocabToken;
    targetLanguage: string;
    nativeLanguage: string;
}) {
    const [showPopover, setShowPopover] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useCloseOnOutsideClick(ref, () => setShowPopover(false));

    const handleSave = async () => {
        if (saving || saved) return;
        setSaving(true);
        try {
            await wordsApi.create({
                text: token.term,
                definition: token.meaning,
                sourceLanguage: targetLanguage,
                targetLanguage: nativeLanguage,
                sourceTitle: 'Conversation Practice',
            });
            setSaved(true);
        } catch {
            // silently fail
        } finally {
            setSaving(false);
        }
    };

    return (
        <span ref={ref} className="relative inline-block">
            <span
                onClick={() => setShowPopover(!showPopover)}
                className="inline-flex items-center gap-1 bg-blue-500/15 text-blue-700 dark:text-blue-300
                    px-2 py-0.5 rounded-md text-xs font-medium cursor-pointer
                    hover:bg-blue-500/25 transition-colors border border-blue-500/20 mx-0.5"
            >
                <span className="font-semibold">{token.term}</span>
                <span className="opacity-60">— {token.meaning}</span>
            </span>

            {showPopover && (
                <div className="absolute z-50 bottom-full left-0 mb-2 w-56 rounded-lg border bg-popover p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="space-y-2">
                        <div>
                            <p className="text-xs text-muted-foreground">Vocabulary</p>
                            <p className="text-sm font-semibold">{token.term}</p>
                            <p className="text-xs text-muted-foreground">{token.meaning}</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saved || saving}
                            className={`w-full flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-md transition-colors
                                ${saved
                                    ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                                }`}
                        >
                            {saved ? (
                                <><Check className="w-3 h-3" /> Saved</>
                            ) : saving ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                            ) : (
                                <><BookmarkPlus className="w-3 h-3" /> Save to Vocabulary</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </span>
    );
}

// ─── Utility hook ────────────────────────────────────

function useCloseOnOutsideClick(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ref, onClose]);
}
