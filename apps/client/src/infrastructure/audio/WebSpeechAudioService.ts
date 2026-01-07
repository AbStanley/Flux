import type { IAudioService } from "../../core/interfaces/IAudioService";

export class WebSpeechAudioService implements IAudioService {
    private synthesis: SpeechSynthesis;
    private utterance: SpeechSynthesisUtterance | null = null;

    constructor() {
        this.synthesis = window.speechSynthesis;
    }

    getVoices(): SpeechSynthesisVoice[] {
        return this.synthesis.getVoices();
    }

    play(
        text: string,
        voice: SpeechSynthesisVoice | null,
        rate: number,
        onBoundary: (charIndex: number) => void,
        onEnd: () => void
    ): void {
        if (!this.synthesis) {
            throw new Error("SpeechSynthesis not supported");
        }

        this.stop();

        // Mobile Safari/Chrome quirk: sometimes need to resume before playing if it was paused/interrupted
        this.synthesis.resume();

        const safeText = text.replace(/\*/g, ' ');
        this.utterance = new SpeechSynthesisUtterance(safeText);
        // HACK: Assign to window to prevent garbage collection in Chrome/Safari
        (window as any)._speechUtterance = this.utterance;

        if (voice) {
            this.utterance.voice = voice;
        }
        this.utterance.rate = rate;

        this.utterance.onboundary = (event) => {
            if (event.name === 'word') {
                onBoundary(event.charIndex);
            }
        };

        this.utterance.onend = () => {
            // Mobile fix: ensure we clear the reference to allow GC and reset state
            this.utterance = null;
            onEnd();
        };

        this.utterance.onerror = (e) => {

            if (e.error === 'interrupted' || e.error === 'canceled') {
                return;
            }

            // Attempt to recover or notify
            onEnd();
        };

        try {
            this.synthesis.speak(this.utterance);
        } catch (e) {

            onEnd();
        }
    }

    pause(): void {
        this.synthesis?.pause();
    }

    resume(): void {
        this.synthesis?.resume();
    }

    stop(): void {
        if (!this.synthesis) return;

        // Prevent existing utterance from firing callbacks during manual cancel
        if (this.utterance) {
            this.utterance.onend = null;
            this.utterance.onerror = null;
        }

        this.synthesis.cancel();
        this.utterance = null;
        (window as any)._speechUtterance = null;
    }
}
