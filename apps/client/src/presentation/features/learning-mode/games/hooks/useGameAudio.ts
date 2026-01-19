import { useEffect, useCallback, useRef } from 'react';

export const useGameAudio = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playAudio = useCallback((text: string, lang?: string, url?: string): Promise<void> => {
        return new Promise((resolve) => {
            if (url) {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                }
                const audio = new Audio(url);
                audioRef.current = audio;

                audio.onended = () => {
                    resolve();
                    audioRef.current = null;
                };
                audio.onerror = () => {
                    resolve();
                    audioRef.current = null;
                };
                audio.play().catch(console.error);
            } else if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();

                const u = new SpeechSynthesisUtterance(text);
                if (lang) {
                    u.lang = lang;
                    // Try to find a specific voice for this language
                    const voices = window.speechSynthesis.getVoices();
                    const lowerLang = lang.toLowerCase();
                    const voice = voices.find(v => {
                        const vLang = v.lang.toLowerCase().replace('_', '-');
                        return vLang === lowerLang || vLang.startsWith(lowerLang + '-');
                    });

                    if (voice) {
                        u.voice = voice;
                    }
                }

                const timeoutId = setTimeout(() => {
                    resolve();
                }, 3000);

                u.onend = () => {
                    clearTimeout(timeoutId);
                    resolve();
                };
                u.onerror = () => {
                    clearTimeout(timeoutId);
                    resolve();
                };

                window.speechSynthesis.speak(u);
            } else {
                resolve();
            }
        });
    }, []);

    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, [stopAudio]);

    return { playAudio, stopAudio };
};
