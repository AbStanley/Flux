export const LANGUAGES = [
    'Spanish', 'English', 'French', 'German', 'Italian', 'Portuguese',
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi',
    'Dutch', 'Swedish', 'Polish', 'Turkish', 'Greek', 'Hebrew',
];

export const LEVELS = [
    { value: 'beginner', label: 'Beginner', description: 'Simple words, short sentences' },
    { value: 'intermediate', label: 'Intermediate', description: 'Everyday conversations' },
    { value: 'advanced', label: 'Advanced', description: 'Natural speech, complex grammar' },
];

/** Map language names to BCP-47 codes for Speech Recognition */
export const LANGUAGE_CODES: Record<string, string> = {
    Spanish: 'es-ES', English: 'en-US', French: 'fr-FR', German: 'de-DE',
    Italian: 'it-IT', Portuguese: 'pt-BR', Russian: 'ru-RU', Chinese: 'zh-CN',
    Japanese: 'ja-JP', Korean: 'ko-KR', Arabic: 'ar-SA', Hindi: 'hi-IN',
    Dutch: 'nl-NL', Swedish: 'sv-SE', Polish: 'pl-PL', Turkish: 'tr-TR',
    Greek: 'el-GR', Hebrew: 'he-IL',
};

export const TOPICS = [
    { value: '', label: 'Free conversation' },
    { value: 'ordering food at a restaurant', label: 'Ordering food' },
    { value: 'weekend plans and hobbies', label: 'Weekend plans' },
    { value: 'travel and vacations', label: 'Travel' },
    { value: 'daily routine and work', label: 'Daily routine' },
    { value: 'shopping and prices', label: 'Shopping' },
    { value: 'weather and seasons', label: 'Weather' },
    { value: 'family and relationships', label: 'Family' },
    { value: 'movies, music, and entertainment', label: 'Entertainment' },
    { value: 'health and fitness', label: 'Health' },
    { value: 'giving and asking for directions', label: 'Directions' },
    { value: 'job interview practice', label: 'Job interview' },
    { value: 'describing your city or hometown', label: 'My city' },
    { value: 'cooking and recipes', label: 'Cooking' },
    { value: 'technology and social media', label: 'Technology' },
];
