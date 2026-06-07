import type { IAudioService } from "../../core/interfaces/IAudioService";
import { stripMarkdown } from "./markdown-utils";

declare global {
    interface Window {
        _speechUtterance?: SpeechSynthesisUtterance | null;
    }
}

const isMobileDevice = (): boolean =>
    typeof window !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

export class WebSpeechAudioService implements IAudioService {
    private synthesis: SpeechSynthesis;
    private utterance: SpeechSynthesisUtterance | null = null;
    private simulatedIntervalId: number | null = null;

    constructor(synthesis: SpeechSynthesis = window.speechSynthesis) {
        this.synthesis = synthesis;
    }

    getVoices(): SpeechSynthesisVoice[] {
        return this.synthesis ? this.synthesis.getVoices() : [];
    }

    play(
        text: string,
        voice: SpeechSynthesisVoice | null,
        rate: number,
        onBoundary: (charIndex: number) => void,
        onEnd: () => void
    ): void {
        if (!this.synthesis) {
            console.error("SpeechSynthesis not supported");
            return onEnd();
        }

        this.stop();

        try {
            this.synthesis.speak(new SpeechSynthesisUtterance(''));
        } catch (e) {
            console.error("Priming failed:", e);
        }

        if (this.synthesis.paused) {
            this.synthesis.resume();
        }

        const { cleanText, indexMap } = stripMarkdown(text);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        this.utterance = utterance;
        window._speechUtterance = utterance;

        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        }
        utterance.rate = rate;

        const clearTimers = () => {
            if (this.simulatedIntervalId !== null) {
                window.clearInterval(this.simulatedIntervalId);
                this.simulatedIntervalId = null;
            }
        };

        utterance.onend = () => {
            this.utterance = null;
            clearTimers();
            onEnd();
        };

        utterance.onerror = (e) => {
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
                this.utterance = null;
                clearTimers();
                onEnd();
            }
        };

        if (isMobileDevice()) {
            const wordRegex = /[\p{L}\p{N}]+/gu;
            const words: { index: number; text: string }[] = [];
            let match;
            while ((match = wordRegex.exec(cleanText)) !== null) {
                words.push({ index: match.index, text: match[0] });
            }

            let wordIndex = 0;
            let lastTickTime = performance.now();
            let accumulatedElapsed = 0;

            this.simulatedIntervalId = window.setInterval(() => {
                if (!this.utterance) {
                    return clearTimers();
                }

                const now = performance.now();
                const delta = now - lastTickTime;
                lastTickTime = now;
                accumulatedElapsed += delta;

                let activeIndex = -1;
                while (wordIndex < words.length) {
                    const word = words[wordIndex];
                    let pause = 0;
                    const nextCharIndex = word.index + word.text.length;
                    if (nextCharIndex < cleanText.length) {
                        const nextChar = cleanText[nextCharIndex];
                        if (/[.!?]/.test(nextChar)) pause = 450;
                        else if (/[,\-:]/.test(nextChar)) pause = 200;
                    }

                    const wordDuration = (150 + word.text.length * 55 + pause) / rate;

                    if (accumulatedElapsed >= 0) {
                        activeIndex = word.index;
                        accumulatedElapsed -= wordDuration;
                        wordIndex++;
                    } else {
                        break;
                    }
                }

                if (activeIndex !== -1) {
                    onBoundary(indexMap[activeIndex] ?? activeIndex);
                }

                if (wordIndex >= words.length) {
                    clearTimers();
                }
            }, 25);
        } else {
            utterance.onboundary = (event) => {
                if (event.name === 'word') {
                    onBoundary(indexMap[event.charIndex] ?? event.charIndex);
                }
            };
        }

        try {
            this.synthesis.speak(utterance);
        } catch (e) {
            console.error("Error calling speak:", e);
            clearTimers();
            onEnd();
        }
    }

    pause(): void {
        if (isMobileDevice()) {
            if (this.utterance) {
                this.utterance.onend = null;
                this.utterance.onerror = null;
            }
            this.synthesis.cancel();
            if (this.simulatedIntervalId !== null) {
                window.clearInterval(this.simulatedIntervalId);
                this.simulatedIntervalId = null;
            }
            this.utterance = null;
        } else {
            this.synthesis?.pause();
        }
    }

    resume(): void {
        this.synthesis?.resume();
    }

    stop(): void {
        if (!this.synthesis) return;

        if (this.simulatedIntervalId !== null) {
            window.clearInterval(this.simulatedIntervalId);
            this.simulatedIntervalId = null;
        }

        if (this.utterance) {
            this.utterance.onend = null;
            this.utterance.onerror = null;
        }

        this.synthesis.cancel();
        this.utterance = null;
        if (window._speechUtterance) {
            window._speechUtterance = null;
        }
    }
}
