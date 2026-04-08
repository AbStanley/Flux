import { defaultClient } from './api-client';

const ENDPOINT = '/api/stats';

export interface StatsOverview {
    totalWords: number;
    totalPhrases: number;
    languages: { source: string; target: string; count: number }[];
    srs: { total: number; due: number; learned: number; reviewedToday: number };
    streakDays: number;
}

export interface DailyActivity {
    date: string;
    wordsAdded: number;
    wordsReviewed: number;
}

export const statsApi = {
    getOverview: () => defaultClient.get<StatsOverview>(`${ENDPOINT}/overview`),
    getActivity: (days = 30, offset = 0) => defaultClient.get<DailyActivity[]>(`${ENDPOINT}/activity?days=${days}&offset=${offset}`),
};
