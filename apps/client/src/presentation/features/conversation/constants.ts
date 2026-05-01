import { 
    ALL_LANGUAGES, 
    SPEECH_CODE_MAP 
} from '@/core/constants/languages';

export const LANGUAGES = ALL_LANGUAGES.filter(l => l.speechCode).map(l => l.name);

export const LEVELS = [
    { value: 'beginner', label: 'Beginner', description: 'Simple words, short sentences' },
    { value: 'intermediate', label: 'Intermediate', description: 'Everyday conversations' },
    { value: 'advanced', label: 'Advanced', description: 'Natural speech, complex grammar' },
];

/** Map language names to BCP-47 codes for Speech Recognition */
export const LANGUAGE_CODES = SPEECH_CODE_MAP;

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
