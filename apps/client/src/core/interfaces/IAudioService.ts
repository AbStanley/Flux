export interface IAudioService {
    play(text: string, voice: SpeechSynthesisVoice | null, rate: number, onBoundary: (charIndex: number) => void, onEnd: () => void): void;
    pause(): void;
    resume(): void;
    stop(): void;
    getVoices(): SpeechSynthesisVoice[];
}
