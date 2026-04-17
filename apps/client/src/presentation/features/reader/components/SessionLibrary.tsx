import { useEffect, useState } from 'react';
import { Button } from '@/presentation/components/ui/button';
import { readingSessionsApi, type ReadingSessionSummary, type ReadingSession, type ChapterInfo } from '@/infrastructure/api/reading-sessions';
import { useReaderStore } from '../store/useReaderStore';
import { BookOpen, ChevronDown, ChevronRight, FileText, Trash2 } from 'lucide-react';

/** Extract chapter previews from full session text */
function getChapterPreviews(session: ReadingSession): Map<string, string> {
    const previews = new Map<string, string>();
    const isPdf = session.fileType === 'pdf';

    if (isPdf) {
        const pageHeaders = [...session.text.matchAll(/^--- Page (\d+) ---$/gm)];
        const parts = session.text.split(/^--- Page \d+ ---$/m);
        pageHeaders.forEach((match, i) => {
            const content = (parts[i + 1] || '').trim();
            previews.set(`Page ${match[1]}`, content.slice(0, 120).replace(/\s+/g, ' '));
        });
    } else {
        const parts = session.text.split(/^### /m);
        for (const part of parts) {
            if (!part.trim()) continue;
            const nl = part.indexOf('\n');
            if (nl === -1) continue;
            const label = part.slice(0, nl).trim();
            const content = part.slice(nl).trim();
            previews.set(label, content.slice(0, 120).replace(/\s+/g, ' '));
        }
    }
    return previews;
}

export function SessionLibrary() {
    const [sessions, setSessions] = useState<ReadingSessionSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [expandedData, setExpandedData] = useState<ReadingSession | null>(null);
    const [loadingChapters, setLoadingChapters] = useState(false);

    useEffect(() => {
        readingSessionsApi.getAll()
            .then(setSessions)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleResume = async (session: ReadingSessionSummary) => {
        const full = await readingSessionsApi.getOne(session.id);
        const store = useReaderStore.getState();
        store.setSession(full.id, full.title);
        if (full.sourceLang) store.setSourceLang(full.sourceLang);
        if (full.targetLang) store.setTargetLang(full.targetLang);
        store.loadText(full.text);
        setTimeout(() => {
            store.setPage(full.currentPage || 1);
            store.setIsReading(true);
        }, 50);
    };

    const handleLoadChapter = async (sessionId: string, chapterLabel: string) => {
        const full = await readingSessionsApi.getOne(sessionId);
        const isPdf = full.fileType === 'pdf';

        const chapterMap = new Map<string, string>();

        if (isPdf) {
            // PDF: split by --- Page N --- markers
            const parts = full.text.split(/^--- Page \d+ ---$/m);
            const pageHeaders = [...full.text.matchAll(/^--- Page (\d+) ---$/gm)];
            pageHeaders.forEach((match, i) => {
                const content = (parts[i + 1] || '').trim();
                if (content) chapterMap.set(`Page ${match[1]}`, content);
            });
        } else {
            // EPUB: split by ### headers
            const parts = full.text.split(/^### /m);
            for (const part of parts) {
                if (!part.trim()) continue;
                const newlineIdx = part.indexOf('\n');
                if (newlineIdx === -1) continue;
                const label = part.slice(0, newlineIdx).trim();
                const content = part.slice(newlineIdx).trim();
                chapterMap.set(label, content);
            }
        }

        // Find chapter: exact match, then case-insensitive, then partial match
        const target = chapterLabel.trim();
        let chapterText = chapterMap.get(target) || '';
        if (!chapterText) {
            for (const [key, value] of chapterMap) {
                if (key.toLowerCase() === target.toLowerCase()) { chapterText = value; break; }
            }
        }
        if (!chapterText) {
            for (const [key, value] of chapterMap) {
                if (key.toLowerCase().includes(target.toLowerCase()) ||
                    target.toLowerCase().includes(key.toLowerCase())) { chapterText = value; break; }
            }
        }

        const store = useReaderStore.getState();
        store.setSession(full.id, `${full.title} - ${chapterLabel}`);
        if (full.sourceLang) store.setSourceLang(full.sourceLang);
        if (full.targetLang) store.setTargetLang(full.targetLang);
        store.loadText(chapterText || full.text);
        store.setIsReading(true);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await readingSessionsApi.remove(id);
        setSessions(s => s.filter(sess => sess.id !== id));
    };

    const handleDeleteAll = async () => {
        if (!confirm('Delete all sessions? This cannot be undone.')) return;
        await Promise.all(sessions.map(s => readingSessionsApi.remove(s.id).catch(console.error)));
        setSessions([]);
    };

    if (loading) {
        return (
            <div className="border rounded-lg p-4 bg-muted/20">
                <p className="text-xs text-muted-foreground text-center">Loading library...</p>
            </div>
        );
    }

    if (sessions.length === 0) return null;

    return (
        <div className="border rounded-lg bg-muted/20 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">My Library</h3>
                <span className="text-xs text-muted-foreground ml-auto">{sessions.length} documents</span>
                <button
                    onClick={handleDeleteAll}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors px-1.5 py-0.5 rounded hover:bg-destructive/10"
                    title="Delete all sessions"
                >
                    Clear All
                </button>
            </div>

            <div className={`divide-y ${sessions.length > 3 ? 'max-h-64 overflow-y-auto' : ''}`}>
                {sessions.map((session) => {
                    const isExpanded = expandedId === session.id;
                    const hasChapters = session.chapters && Array.isArray(session.chapters) && session.chapters.length > 0;
                    const progress = session.totalPages > 0
                        ? Math.round((session.currentPage / session.totalPages) * 100)
                        : 0;
                    const date = new Date(session.updatedAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric',
                    });

                    return (
                        <div key={session.id}>
                            {/* Document row — only toggles expand or resumes */}
                            <div
                                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors group"
                                onClick={() => {
                                    if (hasChapters) {
                                        if (isExpanded) {
                                            setExpandedId(null);
                                            setExpandedData(null);
                                        } else {
                                            setExpandedId(session.id);
                                            setLoadingChapters(true);
                                            readingSessionsApi.getOne(session.id)
                                                .then(setExpandedData)
                                                .catch(console.error)
                                                .finally(() => setLoadingChapters(false));
                                        }
                                    } else {
                                        handleResume(session);
                                    }
                                }}
                            >
                                {hasChapters ? (
                                    isExpanded
                                        ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                                        : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                ) : (
                                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                )}

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{session.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {session.fileType && <span className="uppercase">{session.fileType} · </span>}
                                        p.{session.currentPage}/{session.totalPages} · {date}
                                    </p>
                                </div>

                                {/* Progress bar */}
                                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                                </div>

                                {/* Resume button */}
                                {hasChapters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 shrink-0"
                                        onClick={(e) => { e.stopPropagation(); handleResume(session); }}
                                    >
                                        Resume
                                    </Button>
                                )}

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => handleDelete(session.id, e)}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>

                            {/* Chapter list with previews */}
                            {isExpanded && hasChapters && (
                                <div className="bg-background/50 border-t max-h-72 overflow-y-auto">
                                    {loadingChapters ? (
                                        <p className="text-xs text-muted-foreground text-center py-4">Loading chapters...</p>
                                    ) : (
                                        <RenderChapters
                                            chapters={session.chapters as ChapterInfo[]}
                                            sessionId={session.id}
                                            onSelect={handleLoadChapter}
                                            previews={expandedData ? getChapterPreviews(expandedData) : new Map()}
                                            depth={0}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function RenderChapters({ chapters, sessionId, onSelect, previews, depth }: {
    chapters: ChapterInfo[];
    sessionId: string;
    onSelect: (sessionId: string, label: string) => void;
    previews: Map<string, string>;
    depth: number;
}) {
    return (
        <div className={depth === 0 ? 'p-1.5 grid gap-1' : 'grid gap-1'}>
            {chapters.map((ch, i) => {
                const preview = previews.get(ch.label);
                return (
                    <div key={`${ch.href}-${i}`}>
                        <button
                            className="w-full text-left rounded-lg px-3 py-2 hover:bg-primary/10 transition-colors group/ch"
                            style={{ marginLeft: `${depth * 12}px` }}
                            onClick={() => onSelect(sessionId, ch.label)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0 group-hover/ch:bg-primary" />
                                <span className="text-sm font-medium truncate">{ch.label}</span>
                            </div>
                            {preview && (
                                <p className="text-[11px] text-muted-foreground/70 line-clamp-2 mt-0.5 ml-[22px]">
                                    {preview}...
                                </p>
                            )}
                        </button>
                        {ch.subitems && ch.subitems.length > 0 && (
                            <RenderChapters
                                chapters={ch.subitems}
                                sessionId={sessionId}
                                onSelect={onSelect}
                                previews={previews}
                                depth={depth + 1}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

