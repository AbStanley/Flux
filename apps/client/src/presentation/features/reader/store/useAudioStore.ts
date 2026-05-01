import { create } from 'zustand';
import { WebSpeechAudioService } from '../../../../infrastructure/audio/WebSpeechAudioService';
import { useReaderStore } from './useReaderStore';
import { LANGUAGE_CODE_MAP as CORE_MAP } from '@/core/constants/languages';



interface AudioState {
    isPlaying: boolean;
    isPaused: boolean;
    activeSingleText: string | null; // Tracks the text currently playing via playSingle
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

    play: () => void;
    seek: (tokenIndex: number) => void;
    playSingle: (text: string) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    togglePlayPause: () => void;
    setVoiceByLanguageName: (languageName: string) => void;
}

// Create a singleton service instance
const audioService = new WebSpeechAudioService();

export const useAudioStore = create<AudioState>((set, get) => ({
    isPlaying: false,
    isPaused: false,
    activeSingleText: null,
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

            const currentVoice = get().selectedVoice;

            // Should we update the selected voice?
            if (voices.length > 0) {
                if (currentVoice) {
                    // Try to match by name (reference might have changed)
                    const sameVoice = voices.find(v => v.name === currentVoice.name);
                    if (sameVoice) {
                        // Update reference but keep selection
                        set({ selectedVoice: sameVoice });
                        return;
                    }
                }

                // If no current voice or it's gone, pick default
                if (!currentVoice) {
                    const defaultVoice = voices.find((v: SpeechSynthesisVoice) => v.default) || voices[0];
                    set({ selectedVoice: defaultVoice });
                }
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    },

    setVoice: (voice) => set({ selectedVoice: voice }),
    setRate: (rate) => {
        set({ playbackRate: rate });
        // If playing, we must restart to apply the new rate
        const { isPlaying, currentWordIndex } = get();
        if (isPlaying && currentWordIndex !== null) {
            get().seek(currentWordIndex);
        }
    },

    setTokens: (tokens) => {
        // Stop any current playback when tokens (text content) change
        audioService.stop();

        // Pre-calculate start indices for performance
        const offsets: number[] = [];
        let currentLen = 0;
        tokens.forEach(token => {
            offsets.push(currentLen);
            currentLen += token.length;
        });

        // Update state and RESET audio tracking
        set({
            tokenOffsets: offsets,
            tokens: tokens,
            isPlaying: false,
            isPaused: false,
            currentWordIndex: null
        });
    },

    play: () => {
        // Resume from current spot if available, else start from current page
        const { currentWordIndex, tokens } = get();
        if (currentWordIndex !== null && currentWordIndex > 0 && currentWordIndex < tokens.length) {
            get().seek(currentWordIndex);
        } else {
            // Start from the current page's first token
            const { currentPage, PAGE_SIZE } = useReaderStore.getState();
            const pageStart = (currentPage - 1) * PAGE_SIZE;
            const startIndex = Math.max(0, Math.min(pageStart, tokens.length - 1));
            get().seek(startIndex);
        }
    },

    seek: (tokenIndex: number) => {
        const { selectedVoice, playbackRate, tokenOffsets, tokens } = get();

        // Validate index — need at least one token
        if (tokens.length === 0 || tokenIndex < 0 || tokenIndex >= tokens.length) return;

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
        const { currentWordIndex } = get();
        // Native resume only works if the speech synthesis was actually paused.
        // If we "paused" via playSingle (which calls stop), or if the engine was stopped/interrupted,
        // native resume() does nothing.
        // We fallback to seeking to the current index to restart playback from there.
        if (currentWordIndex !== null) {
            get().seek(currentWordIndex);
        } else {
            audioService.resume();
            set({ isPaused: false, isPlaying: true });
        }
    },

    stop: () => {
        audioService.stop();
        set({ isPlaying: false, isPaused: false, currentWordIndex: null });
    },

    togglePlayPause: () => {
        const { isPlaying, isPaused, play, pause, resume } = get();
        if (isPlaying) {
            pause();
        } else if (isPaused) {
            resume();
        } else {
            play();
        }
    },

    playSingle: (text: string) => {
        const { selectedVoice, playbackRate } = get();
        // Stop global playback if running, to avoid overlap
        // We set isPaused=true so the UI shows "Play" button (or Resume state), 
        // and we DO NOT clear currentWordIndex so we can resume.
        audioService.stop();

        set({ isPlaying: false, isPaused: true, activeSingleText: text }); // treat interruption as pause

        audioService.play(
            text,
            selectedVoice,
            playbackRate,
            () => { }, // No-op: Don't update highlight for single word
            () => {
                // Clear active single text when playback completes naturally
                set({ activeSingleText: null });
            }
        );
    },

    setVoiceByLanguageName: (languageName: string) => {
        const { availableVoices } = get();
        const code = LANGUAGE_CODE_MAP[languageName];
        if (!code) return;

        // Find the first voice that matches the language code
        const matchingVoice = availableVoices.find(v => v.lang.startsWith(code));

        if (matchingVoice) {
            set({ selectedVoice: matchingVoice });
        }
    }
}));

const LANGUAGE_CODE_MAP = CORE_MAP;



