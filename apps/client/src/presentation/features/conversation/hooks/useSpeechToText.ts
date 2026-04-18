import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
    error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getRecognitionClass(): SpeechRecognitionConstructor | null {
    const w = window as unknown as Record<string, unknown>;
    return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionConstructor | null;
}

const ERROR_MESSAGES: Record<string, string> = {
    'not-allowed': 'Microphone access denied. Enable it in your browser settings.',
    'service-not-allowed': 'Speech recognition service is not available.',
    'audio-capture': 'No microphone detected.',
    'no-speech': 'No speech detected. Try again.',
    'network': 'Network error — speech recognition requires an internet connection.',
    'aborted': '',
};

export function useSpeechToText(lang: string, onResult: (text: string) => void) {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const supported = !!getRecognitionClass();

    const stop = useCallback(() => {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setIsListening(false);
    }, []);

    const start = useCallback(() => {
        const Ctor = getRecognitionClass();
        if (!Ctor) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        setError(null);

        // Stop any existing session
        if (recognitionRef.current) {
            recognitionRef.current.abort();
            recognitionRef.current = null;
        }

        const recognition = new Ctor();
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (e: SpeechRecognitionEvent) => {
            const last = e.results[e.results.length - 1];
            if (last?.isFinal && last?.[0]) {
                onResult(last[0].transcript);
            }
        };

        recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
            const code = e.error;
            console.warn('[SpeechRecognition] error:', code);
            const message = ERROR_MESSAGES[code] ?? `Speech recognition error: ${code}`;
            if (message) setError(message);
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        try {
            recognitionRef.current = recognition;
            recognition.start();
            setIsListening(true);
        } catch (err) {
            console.error('[SpeechRecognition] failed to start:', err);
            setError('Failed to start speech recognition.');
            setIsListening(false);
            recognitionRef.current = null;
        }
    }, [lang, onResult]);

    const toggle = useCallback(() => {
        if (isListening) stop();
        else start();
    }, [isListening, start, stop]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            recognitionRef.current?.abort();
        };
    }, []);

    return { isListening, toggle, supported, error };
}
