export const SelectionMode = {
    Word: 'word',
    Sentence: 'sentence'
} as const;

export type SelectionMode = typeof SelectionMode[keyof typeof SelectionMode];

export const HoverPosition = {
    Start: 'start',
    Middle: 'middle',
    End: 'end',
    Single: 'single'
} as const;

export type HoverPosition = typeof HoverPosition[keyof typeof HoverPosition];

export const Language = {
    Auto: 'auto',
    English: 'en',
    Spanish: 'es',
    French: 'fr',
    German: 'de',
    Italian: 'it',
    Portuguese: 'pt',
    Russian: 'ru',
    Chinese: 'zh',
    Japanese: 'ja',
    Korean: 'ko'
} as const;

export type Language = typeof Language[keyof typeof Language];
