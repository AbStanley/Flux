import { create } from 'zustand';
import { useReaderStore } from './useReaderStore';
import {
    audioService,
    handleInit,
    handleSeek,
    handlePlaySingle,
    handleSetVoiceByLanguageName
} from './audioStoreHelpers';

export interface AudioState {
    isPlaying: boolean;
    isPaused: boolean;
    activeSingleText: string | null;
    currentWordIndex: number | null;
    playbackRate: number;
    selectedVoice: SpeechSynthesisVoice | null;
    availableVoices: SpeechSynthesisVoice[];
    tokenOffsets: number[];
    tokens: string[];

    init: () => void;
    setVoice: (voice: SpeechSynthesisVoice) => void;
    setRate: (rate: number) => void;
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

    init: () => handleInit(set, get),

    setVoice: (voice) => {
        set({ selectedVoice: voice });
        if (voice) {
            localStorage.setItem(`flux_voice_${voice.lang}`, voice.name);
            localStorage.setItem('flux_last_voice_name', voice.name);
        }
    },

    setRate: (rate) => {
        set({ playbackRate: rate });
        const { isPlaying, currentWordIndex } = get();
        if (isPlaying && currentWordIndex !== null) {
            get().seek(currentWordIndex);
        }
    },

    setTokens: (tokens) => {
        audioService.stop();
        const offsets: number[] = [];
        let currentLen = 0;
        tokens.forEach(token => {
            offsets.push(currentLen);
            currentLen += token.length;
        });

        set({
            tokenOffsets: offsets,
            tokens: tokens,
            isPlaying: false,
            isPaused: false,
            currentWordIndex: null
        });
    },

    play: () => {
        const { currentWordIndex, tokens } = get();
        if (currentWordIndex !== null && currentWordIndex > 0 && currentWordIndex < tokens.length) {
            get().seek(currentWordIndex);
        } else {
            const { currentPage, PAGE_SIZE } = useReaderStore.getState();
            const pageStart = (currentPage - 1) * PAGE_SIZE;
            const startIndex = Math.max(0, Math.min(pageStart, tokens.length - 1));
            get().seek(startIndex);
        }
    },

    seek: (tokenIndex) => handleSeek(tokenIndex, set, get),

    pause: () => {
        audioService.pause();
        set({ isPaused: true, isPlaying: false });
    },

    resume: () => {
        const { currentWordIndex } = get();
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

    playSingle: (text) => handlePlaySingle(text, set, get),

    setVoiceByLanguageName: (languageName) => handleSetVoiceByLanguageName(languageName, set, get)
}));
