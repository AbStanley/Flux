import { useEffect, useState } from 'react';
import { Button } from '@/presentation/components/ui/button';
import { readingSessionsApi, type ReadingSessionSummary, type ChapterInfo } from '@/infrastructure/api/reading-sessions';
import { useReaderStore } from '../store/useReaderStore';
import { BookOpen, ChevronDown, ChevronRight, FileText, Trash2 } from 'lucide-react';

export function SessionLibrary() {
    const [sessions, setSessions] = useState<ReadingSessionSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

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
        console.log('[Library] handleLoadChapter called:', chapterLabel);
        const full = await readingSessionsApi.getOne(sessionId);

        // Split by ### headers and build a map of chapter label → content
        const chapterMap = new Map<string, string>();
        const parts = full.text.split(/^### /m);
        for (const part of parts) {
            if (!part.trim()) continue;
            const newlineIdx = part.indexOf('\n');
            if (newlineIdx === -1) continue;
            const label = part.slice(0, newlineIdx).trim();
            const content = part.slice(newlineIdx).trim();
            chapterMap.set(label, content);
        }

        console.log('[Library] Available chapters:', [...chapterMap.keys()]);

        // Find chapter: exact match, then case-insensitive, then partial match
        let chapterText = chapterMap.get(chapterLabel.trim()) || '';
        if (!chapterText) {
            for (const [key, value] of chapterMap) {
                if (key.toLowerCase() === chapterLabel.trim().toLowerCase()) {
                    chapterText = value;
                    break;
                }
            }
        }
        if (!chapterText) {
            for (const [key, value] of chapterMap) {
                if (key.toLowerCase().includes(chapterLabel.trim().toLowerCase()) ||
                    chapterLabel.trim().toLowerCase().includes(key.toLowerCase())) {
                    chapterText = value;
                    break;
                }
            }
        }

        console.log('[Library] Chapter text found:', chapterText.length, 'chars');

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
            </div>

            <div className="max-h-64 overflow-y-auto divide-y">
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
                                        setExpandedId(isExpanded ? null : session.id);
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

                            {/* Chapter list with nested subitems */}
                            {isExpanded && hasChapters && (
                                <div className="bg-background/50 border-t max-h-48 overflow-y-auto">
                                    <RenderChapters
                                        chapters={session.chapters as ChapterInfo[]}
                                        sessionId={session.id}
                                        onSelect={handleLoadChapter}
                                        depth={0}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function RenderChapters({ chapters, sessionId, onSelect, depth }: {
    chapters: ChapterInfo[];
    sessionId: string;
    onSelect: (sessionId: string, label: string) => void;
    depth: number;
}) {
    return (
        <>
            {chapters.map((ch, i) => (
                <div key={`${ch.href}-${i}`}>
                    <button
                        className="w-full text-left py-1.5 text-sm hover:bg-primary/10 transition-colors flex items-center gap-2"
                        style={{ paddingLeft: `${16 + depth * 16}px` }}
                        onClick={() => {
                            console.log('[Library] Chapter clicked:', ch.label);
                            onSelect(sessionId, ch.label);
                        }}
                    >
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                        <span className="truncate">{ch.label}</span>
                    </button>
                    {ch.subitems && ch.subitems.length > 0 && (
                        <RenderChapters
                            chapters={ch.subitems}
                            sessionId={sessionId}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    )}
                </div>
            ))}
        </>
    );
}

