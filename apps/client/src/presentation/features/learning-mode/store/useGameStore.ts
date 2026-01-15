import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameItem, GameContentParams } from '../../../../core/services/game/interfaces';
import { gameContentService } from '../../../../core/services/game/GameContentService';
import { useUserStats } from './useUserStats';

export interface GameConfig {
    mode: 'multiple-choice' | 'build-word' | 'dictation' | 'scramble' | 'story';
    source: 'db' | 'anki' | 'ai';
    timerEnabled: boolean;
    sourceLang: string;
    targetLang: string;
    // Anki Specific
    ankiDeckName?: string;
    ankiFieldSource?: string;
    ankiFieldTarget?: string;
    ankiHost?: string;
    // AI Specific
    aiTopic?: string;
    aiModel?: string;
    aiHost?: string;
    aiLevel?: 'beginner' | 'intermediate' | 'advanced';
}

interface GameState {
    status: 'idle' | 'loading' | 'playing' | 'paused' | 'finished';

    // Config (Persistent)
    config: GameConfig;

    // Session
    items: GameItem[];
    currentIndex: number;
    score: number;
    streak: number;
    timeLeft: number;
    isTimerPaused: boolean;
    health: number;
    maxHealth: number;
    error: string | null;
    history: Record<string, boolean>;

    // Actions
    updateConfig: (updates: Partial<GameConfig>) => void;
    startGame: () => Promise<void>; // Uses config
    restartGame: () => Promise<void>;
    submitAnswer: (isCorrect: boolean) => void;
    nextItem: () => void;
    endGame: () => void;
    reset: () => void; // Reset Session only
    tick: () => void;
    setTime: (time: number) => void;
    syncProgress: () => Promise<void>;
}

export const useGameStore = create<GameState>()(persist((set, get) => ({
    status: 'idle',
    config: {
        mode: 'multiple-choice',
        source: 'db',
        timerEnabled: true,
        sourceLang: 'all',
        targetLang: 'all'
    },
    items: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    timeLeft: 100,
    health: 3,
    maxHealth: 3,
    error: null,
    isTimerPaused: false,
    history: {},

    updateConfig: (updates) => set((state) => ({ config: { ...state.config, ...updates } })),

    startGame: async () => {
        const { config } = get();

        // Prepare Params from Config
        const params: GameContentParams = {
            source: config.source,
            config: {
                limit: 10,
                gameMode: config.mode,
                timerEnabled: config.timerEnabled,
                language: {
                    source: config.sourceLang !== 'all' ? config.sourceLang : undefined,
                    target: config.targetLang !== 'all' ? config.targetLang : undefined
                },
                // Pass Anki config
                collectionId: config.ankiDeckName,

                ...(config.ankiFieldSource || config.ankiFieldTarget ? {
                    ankiFieldSource: config.ankiFieldSource,
                    ankiFieldTarget: config.ankiFieldTarget
                } : {}),

                // Pass AI config
                aiTopic: config.aiTopic,
                aiModel: config.aiModel,
                aiHost: config.aiHost,
                aiLevel: config.aiLevel
            }
        };

        set({
            status: 'loading',
            items: [],
            currentIndex: 0,
            score: 0,
            streak: 0,
            health: 3,
            timeLeft: 100, // 10.0s
            isTimerPaused: false,
            history: {}
        });

        try {
            set({ error: null }); // Clear previous errors
            const items = await gameContentService.getItems(params);
            if (items.length === 0) {
                const msg = "No items found for game. Please checks your filters.";
                console.warn(msg);
                set({ status: 'idle', error: msg });
                return;
            }
            set({ items, status: 'playing' });
        } catch (error: unknown) {
            console.error("Failed to start game:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to start game";
            set({ status: 'idle', error: errorMessage });
        }
    },

    restartGame: async () => {
        const { startGame } = get();
        await startGame();
    },

    submitAnswer: (isCorrect) => {
        const { score, streak, health, items, currentIndex, history } = get();
        set({ isTimerPaused: true });

        // Record history
        const currentItem = items[currentIndex];
        if (currentItem) {
            set({ history: { ...history, [currentItem.id]: isCorrect } });
        }

        if (isCorrect) {
            const newScore = score + 10 + (streak * 2);
            console.log(`[GameStore] Correct! Old Score: ${score}, Streak: ${streak}, New Score: ${newScore}`);
            set({
                score: newScore,
                streak: streak + 1
            });
        } else {
            console.log(`[GameStore] Wrong! Streak reset.`);
            set({
                streak: 0,
                health: Math.max(0, health - 1)
            });
        }
    },

    nextItem: () => {
        const { currentIndex, items, health, status } = get();
        if (status !== 'playing') return;

        if (health <= 0) {
            set({ status: 'finished' });
            return;
        }

        if (currentIndex < items.length - 1) {
            set({ currentIndex: currentIndex + 1, timeLeft: 100, isTimerPaused: false });
        } else {
            set({ status: 'finished' });
        }
    },

    endGame: () => {
        const { score } = get();
        useUserStats.getState().addXp(score);
        useUserStats.getState().incrementGamesPlayed();
        set({ status: 'finished' });
    },

    reset: () => set({
        status: 'idle',
        items: [],
        currentIndex: 0,
        score: 0,
        streak: 0,
        timeLeft: 100,
        health: 3,
        history: {},
        // Config preserved
        isTimerPaused: false
    }),

    setTime: (time) => set({ timeLeft: time }),

    tick: () => {
        const { timeLeft, status, submitAnswer, config, isTimerPaused } = get();
        if (status !== 'playing' || !config.timerEnabled || isTimerPaused) return;

        if (timeLeft > 0) {
            set({ timeLeft: timeLeft - 1 });
        } else {
            submitAnswer(false);
        }
    },

    syncProgress: async () => {
        const { config, items, history } = get();
        await gameContentService.syncProgress(config.source, items, history);
    }
}), {
    name: 'game-storage',
    partialize: (state) => ({ config: state.config }),
}));
