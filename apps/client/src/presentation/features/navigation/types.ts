export const AppView = {
    Reading: 'READING',
    WordManager: 'WORD_MANAGER',
    LearningMode: 'LEARNING_MODE',
    InteractiveWriting: 'INTERACTIVE_WRITING',
    SrsReview: 'SRS_REVIEW',
    Stats: 'STATS'
} as const;

export type AppView = typeof AppView[keyof typeof AppView];
