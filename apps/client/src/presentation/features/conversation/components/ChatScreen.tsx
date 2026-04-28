import { useState, useRef, useEffect, useCallback } from 'react';
import { useConversationStore, type ChatMessage } from '../store/useConversationStore';
import { Button } from '../../../components/ui/button';
import { MessageCircle, Send, RotateCcw, Loader2, Mic, MicOff, Sun, Moon, Square } from 'lucide-react';
import { FormattedContent } from './FormattedContent';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { LANGUAGE_CODES } from '../constants';
import { useTheme } from '../../../providers/useTheme';

function MessageBubble({ message, targetLanguage, nativeLanguage, fontSize }: {
    message: ChatMessage;
    targetLanguage: string;
    nativeLanguage: string;
    fontSize: number;
}) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                style={{ fontSize: `${fontSize}px` }}
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-2.5 leading-relaxed
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

const MAX_INPUT_HEIGHT = 160;

export function ChatScreen() {
    const {
        messages,
        isStreaming,
        error,
        sendMessage,
        cancelStreaming,
        reset,
        targetLanguage,
        nativeLanguage,
        fontSize,
        setConfig
    } = useConversationStore();
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const onSpeechResult = useCallback((text: string) => {
        setInput((prev) => (prev ? prev + ' ' + text : text));
    }, []);
    const speechLang = LANGUAGE_CODES[targetLanguage] || 'en-US';
    const { isListening, toggle: toggleMic, supported: micSupported, error: micError } = useSpeechToText(speechLang, onSpeechResult);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = 'auto';
        const next = Math.min(el.scrollHeight, MAX_INPUT_HEIGHT);
        el.style.height = `${next}px`;
        el.style.overflowY = el.scrollHeight > MAX_INPUT_HEIGHT ? 'auto' : 'hidden';
    }, [input]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || isStreaming) return;
        setInput('');
        sendMessage(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const increaseFontSize = () => setConfig({ fontSize: Math.min(fontSize + 1, 24) });
    const decreaseFontSize = () => setConfig({ fontSize: Math.max(fontSize - 1, 10) });

    const visibleMessages = messages.filter((m) => m.role !== 'system');

    return (
        <div className="flex flex-col h-[min(calc(100dvh-65px),700px)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-foreground hidden sm:block">Conversation Practice</h2>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {targetLanguage}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {/* Font Resize Controls */}
                    <div className="flex items-center gap-0.5 mr-2 bg-muted/30 rounded-lg p-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[10px] font-bold"
                            onClick={decreaseFontSize}
                            title="Decrease text size"
                        >
                            A-
                        </Button>
                        <span className="text-[10px] text-muted-foreground w-4 text-center">{fontSize}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-xs font-bold"
                            onClick={increaseFontSize}
                            title="Increase text size"
                        >
                            A+
                        </Button>
                    </div>

                    <ThemeToggle />
                    <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 h-8">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">New</span>
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {visibleMessages.filter((msg) => msg.content).map((msg, i) => (
                    <MessageBubble
                        key={i}
                        message={msg}
                        targetLanguage={targetLanguage}
                        nativeLanguage={nativeLanguage}
                        fontSize={fontSize}
                    />
                ))}

                {isStreaming && visibleMessages[visibleMessages.length - 1]?.content === '' && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] md:max-w-[75%] rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Typing...
                            </div>
                        </div>
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
                {micError && (
                    <div className="text-xs text-destructive mb-2">{micError}</div>
                )}
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2 items-end"
                >
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        disabled={isStreaming}
                        className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        autoFocus
                    />
                    {micSupported && (
                        <Button
                            type="button"
                            size="default"
                            variant={isListening ? 'destructive' : 'outline'}
                            onClick={toggleMic}
                            disabled={isStreaming}
                            className={isListening ? 'animate-pulse' : ''}
                        >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                    )}
                    {isStreaming ? (
                        <Button
                            type="button"
                            size="default"
                            variant="destructive"
                            onClick={cancelStreaming}
                            title="Stop generating"
                        >
                            <Square className="w-4 h-4 fill-current" />
                        </Button>
                    ) : (
                        <Button type="submit" size="default" disabled={!input.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                    )}
                </form>
            </div>
        </div>
    );
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const isDark = theme === 'dark' || theme === 'system';
    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title={isDark ? 'Light mode' : 'Dark mode'}
        >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </Button>
    );
}
