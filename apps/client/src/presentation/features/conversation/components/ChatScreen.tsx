import { useState, useRef, useEffect, useCallback } from 'react';
import { useConversationStore, type ChatMessage } from '../store/useConversationStore';
import { Button } from '../../../components/ui/button';
import { MessageCircle, Send, RotateCcw, Loader2, Mic, MicOff } from 'lucide-react';
import { FormattedContent } from './FormattedContent';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { LANGUAGE_CODES } from '../constants';

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

export function ChatScreen() {
    const { messages, isStreaming, error, sendMessage, reset, targetLanguage, nativeLanguage } =
        useConversationStore();
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    const onSpeechResult = useCallback((text: string) => {
        setInput((prev) => (prev ? prev + ' ' + text : text));
    }, []);
    const speechLang = LANGUAGE_CODES[targetLanguage] || 'en-US';
    const { isListening, toggle: toggleMic, supported: micSupported } = useSpeechToText(speechLang, onSpeechResult);

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
                {visibleMessages.filter((msg) => msg.content).map((msg, i) => (
                    <MessageBubble
                        key={i}
                        message={msg}
                        targetLanguage={targetLanguage}
                        nativeLanguage={nativeLanguage}
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
                    <Button type="submit" size="default" disabled={isStreaming || !input.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
