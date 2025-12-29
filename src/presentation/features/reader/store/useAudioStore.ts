import { create } from 'zustand';

import { WebSpeechAudioService } from '../../../../infrastructure/audio/WebSpeechAudioService';


interface AudioState {
    isPlaying: boolean;
    isPaused: boolean;
    currentWordIndex: number | null; // Global token index
    playbackRate: number;
    selectedVoice: SpeechSynthesisVoice | null;
    availableVoices: SpeechSynthesisVoice[];

    // Data for sync
    tokenOffsets: number[]; // Start index of each token in the full text string
    tokens: string[];       // Full list of tokens

    // Actions
    init: () => void;
    setVoice: (voice: SpeechSynthesisVoice) => void;
    setRate: (rate: number) => void;

    // Called when text changes
    setTokens: (tokens: string[]) => void;

    play: (text: string) => void;
    seek: (tokenIndex: number) => void;
    playSingle: (text: string) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
}

// Create a singleton service instance
const audioService = new WebSpeechAudioService();

export const useAudioStore = create<AudioState>((set, get) => ({
    isPlaying: false,
    isPaused: false,
    currentWordIndex: null,
    playbackRate: 1,
    selectedVoice: null,
    availableVoices: [],
    tokens: [],
    tokenOffsets: [],

    init: () => {
        const loadVoices = () => {
            const voices = audioService.getVoices();
            set({ availableVoices: voices });
            if (voices.length > 0 && !get().selectedVoice) {
                // Try to find a good default voice (Google, Microsoft)
                const defaultVoice = voices.find((v: SpeechSynthesisVoice) => v.default) || voices[0];
                set({ selectedVoice: defaultVoice });
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    },

    setVoice: (voice) => set({ selectedVoice: voice }),
    setRate: (rate) => set({ playbackRate: rate }),

    setTokens: (tokens) => {
        // Pre-calculate start indices for performance
        const offsets: number[] = [];
        let currentLen = 0;
        tokens.forEach(token => {
            offsets.push(currentLen);
            currentLen += token.length;
        });
        set({ tokenOffsets: offsets, tokens: tokens });
    },

    play: (text) => {
        // Just an alias for playing from start
        // NOTE: For consistency, if we have tokens, we should probably prefer playing from tokens[0] 
        // to ensure offsets match, but `text` passed here is usually the full text.
        get().seek(0);
    },

    seek: (tokenIndex: number) => {
        const { selectedVoice, playbackRate, tokenOffsets, tokens } = get();

        // Validate index
        if (tokenIndex < 0 || tokenIndex >= tokens.length) return;

        // Stop any current playback
        audioService.stop();

        // Calculate text to play (from tokenIndex to end)
        const textToPlay = tokens.slice(tokenIndex).join('');

        // The offset in the original full text where this slice begins
        const startCharOffset = tokenOffsets[tokenIndex];

        set({ isPlaying: true, isPaused: false, currentWordIndex: tokenIndex });

        audioService.play(
            textToPlay,
            selectedVoice,
            playbackRate,
            (charIndex: number) => {
                // charIndex is relative to the start of textToPlay
                // We need absolute index in full text
                const absoluteCharIndex = startCharOffset + charIndex;

                // Map charIndex to tokenIndex 
                // We want the largest offset <= absoluteCharIndex
                let foundIndex = -1;

                // Simple loop backwards from end (optimize later if needed)
                for (let i = tokenOffsets.length - 1; i >= 0; i--) {
                    if (tokenOffsets[i] <= absoluteCharIndex) {
                        foundIndex = i;
                        break;
                    }
                }

                if (foundIndex !== -1) {
                    set({ currentWordIndex: foundIndex });
                }
            },
            () => {
                set({ isPlaying: false, isPaused: false, currentWordIndex: null });
            }
        );
    },

    pause: () => {
        audioService.pause();
        set({ isPaused: true, isPlaying: false });
    },

    resume: () => {
        audioService.resume();
        set({ isPaused: false, isPlaying: true });
    },

    stop: () => {
        audioService.stop();
        set({ isPlaying: false, isPaused: false, currentWordIndex: null });
    },

    playSingle: (text: string) => {
        const { selectedVoice, playbackRate } = get();
        // Stop global playback if running, to avoid overlap
        audioService.stop();
        // Ensure global state is reset so highlights don't persist/move
        set({ isPlaying: false, isPaused: false, currentWordIndex: null });

        audioService.play(
            text,
            selectedVoice,
            playbackRate,
            () => { }, // No-op: Don't update highlight for single word
            () => { }  // No-op: No state change on end
        );
    }
}));

