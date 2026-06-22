import { WebSpeechAudioService } from '../../../../infrastructure/audio/WebSpeechAudioService';
import { LANGUAGE_CODE_MAP as CORE_MAP } from '@/core/constants/languages';
import type { StoreApi } from 'zustand';
import type { AudioState } from './useAudioStore';

export const audioService = new WebSpeechAudioService();
export const LANGUAGE_CODE_MAP = CORE_MAP;

type SetState = StoreApi<AudioState>['setState'];
type GetState = StoreApi<AudioState>['getState'];

export function handleInit(set: SetState, get: GetState) {
    const loadVoices = () => {
        const voices = audioService.getVoices();
        set({ availableVoices: voices });

        const currentVoice = get().selectedVoice;

        if (voices.length > 0) {
            if (currentVoice) {
                const sameVoice = voices.find(v => v.name === currentVoice.name);
                if (sameVoice) {
                    set({ selectedVoice: sameVoice });
                    return;
                }
            }

            // Restore from localStorage if present
            const lastVoiceName = localStorage.getItem('flux_last_voice_name');
            if (lastVoiceName) {
                const savedVoice = voices.find(v => v.name === lastVoiceName);
                if (savedVoice) {
                    set({ selectedVoice: savedVoice });
                    return;
                }
            }

            if (!currentVoice) {
                const defaultVoice = voices.find((v: SpeechSynthesisVoice) => v.default) || voices[0];
                set({ selectedVoice: defaultVoice });
            }
        }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function handleSeek(tokenIndex: number, set: SetState, get: GetState) {
    const { selectedVoice, playbackRate, tokenOffsets, tokens } = get();
    if (tokens.length === 0 || tokenIndex < 0 || tokenIndex >= tokens.length) return;

    audioService.stop();

    const textToPlay = tokens.slice(tokenIndex).join('');
    const startCharOffset = tokenOffsets[tokenIndex];

    set({ isPlaying: true, isPaused: false, currentWordIndex: tokenIndex });

    audioService.play(
        textToPlay,
        selectedVoice,
        playbackRate,
        (charIndex: number) => {
            const absoluteCharIndex = startCharOffset + charIndex;
            let foundIndex = -1;

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
}

export function handlePlaySingle(text: string, set: SetState, get: GetState) {
    const { selectedVoice, playbackRate } = get();
    audioService.stop();

    set({ isPlaying: false, isPaused: true, activeSingleText: text });

    audioService.play(
        text,
        selectedVoice,
        playbackRate,
        () => { },
        () => {
            set({ activeSingleText: null });
        }
    );
}

export function handleSetVoiceByLanguageName(languageName: string, set: SetState, get: GetState) {
    const { availableVoices } = get();
    const code = LANGUAGE_CODE_MAP[languageName];
    if (!code) return;

    const matchingVoices = availableVoices.filter(v => v.lang.startsWith(code));
    if (matchingVoices.length === 0) return;

    // Check if there is a saved voice name for this exact language code prefix/name
    let savedVoice: SpeechSynthesisVoice | undefined;
    for (const v of matchingVoices) {
        const saved = localStorage.getItem(`flux_voice_${v.lang}`);
        if (saved === v.name) {
            savedVoice = v;
            break;
        }
    }

    if (!savedVoice) {
        const lastVoiceName = localStorage.getItem('flux_last_voice_name');
        if (lastVoiceName) {
            savedVoice = matchingVoices.find(v => v.name === lastVoiceName);
        }
    }

    const voiceToSet = savedVoice || matchingVoices[0];
    if (voiceToSet) {
        set({ selectedVoice: voiceToSet });
    }
}
