import { defaultClient } from './api-client';

const ENDPOINT = '/api/reading-sessions';

export interface ChapterInfo {
    label: string;
    href: string;
    subitems?: ChapterInfo[];
}

export interface ReadingSessionSummary {
    id: string;
    title: string;
    currentPage: number;
    totalPages: number;
    sourceLang: string | null;
    targetLang: string | null;
    fileType: string | null;
    chapters: ChapterInfo[] | null;
    createdAt: string;
    updatedAt: string;
}

export interface ReadingSession extends ReadingSessionSummary {
    text: string;
}

export const readingSessionsApi = {
    getAll: () => defaultClient.get<ReadingSessionSummary[]>(ENDPOINT),

    getOne: (id: string) => defaultClient.get<ReadingSession>(`${ENDPOINT}/${id}`),

    create: (data: {
        title: string;
        text: string;
        currentPage?: number;
        totalPages?: number;
        sourceLang?: string;
        targetLang?: string;
        fileType?: string;
        chapters?: ChapterInfo[];
    }) => defaultClient.post<ReadingSession>(ENDPOINT, data),

    update: (id: string, data: { currentPage?: number; title?: string; totalPages?: number }) =>
        defaultClient.patch<ReadingSession>(`${ENDPOINT}/${id}`, data),

    remove: (id: string) => defaultClient.delete<void>(`${ENDPOINT}/${id}`),
};
