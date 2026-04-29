import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type UserStats, INITIAL_STATS, userStatsService } from '../../../../core/services/user/UserStatsService';

interface UserStatsStore extends UserStats {
    // Actions
    addXp: (amount: number) => void;
    incrementGamesPlayed: () => void;
    resetStats: () => void; // meaningful for testing/debug
}

export const useUserStats = create<UserStatsStore>()(
    persist(
        (set, get) => ({
            ...INITIAL_STATS,

            addXp: (amount) => {
                const currentStats = get();
                const { newStats, leveledUp } = userStatsService.addXp(currentStats, amount);

                set({ ...newStats });

                if (leveledUp) {
                    // We could trigger a toast or specialized event here if needed
                    console.log("Level Up!", newStats.level);
                }
            },

            incrementGamesPlayed: () => {
                set((state) => ({ gamesPlayed: state.gamesPlayed + 1 }));
            },

            resetStats: () => {
                set(INITIAL_STATS);
            }
        }),
        {
            name: 'flux-user-stats',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
