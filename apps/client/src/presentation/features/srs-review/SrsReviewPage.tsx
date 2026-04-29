import { useEffect, useState, useCallback } from 'react';
import { useSrsStore } from './store/useSrsStore';
import { wordsApi } from '../../../infrastructure/api/words';
import { Button } from '../../components/ui/button';
import { RotateCcw, Brain, CheckCircle2, Flame, Clock, BookOpen, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { getLanguageCode } from '../../features/word-manager/utils/languageUtils';
import { useSettingsStore } from '../settings/store/useSettingsStore';
import confetti from 'canvas-confetti';
import { motion, useAnimation } from 'framer-motion';

export function SrsReviewPage() {
    const {
        status, words, currentIndex, isFlipped, stats,
        reviewedCount, error, sourceLanguage, targetLanguage,
        setFilter, loadDueWords, loadStats, flipCard,
        submitReview, reset,
    } = useSrsStore();

    const [languages, setLanguages] = useState<{ sourceLanguage: string; targetLanguage: string }[]>([]);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const srsRevealAudioMode = useSettingsStore((s) => s.srsRevealAudioMode);
    const setSrsRevealAudioMode = useSettingsStore((s) => s.setSrsRevealAudioMode);
    const currentWord = words[currentIndex];

    const pronounce = useCallback((text: string, lang?: string, resetQueue = true) => {
        if (!audioEnabled) return;
        if (resetQueue) {
            window.speechSynthesis.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getLanguageCode(lang);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }, [audioEnabled]);

    const playRevealAudio = useCallback(() => {
        if (!audioEnabled || !currentWord || srsRevealAudioMode === 'none') return;

        if (srsRevealAudioMode === 'source') {
            pronounce(currentWord.text, currentWord.sourceLanguage);
            return;
        }

        if (srsRevealAudioMode === 'target') {
            pronounce(currentWord.definition || '', currentWord.targetLanguage);
            return;
        }

        if (srsRevealAudioMode === 'both') {
            window.speechSynthesis.cancel();
            pronounce(currentWord.text, currentWord.sourceLanguage, false);
            if (currentWord.definition) {
                pronounce(currentWord.definition, currentWord.targetLanguage, false);
            }
        }
    }, [audioEnabled, currentWord, pronounce, srsRevealAudioMode]);

    // Auto-pronounce when new card appears
    useEffect(() => {
        if (currentWord && status === 'reviewing') {
            pronounce(currentWord.text, currentWord.sourceLanguage);
        }
    }, [currentIndex, currentWord, status, pronounce]);

    useEffect(() => {
        if (!isFlipped || status !== 'reviewing') return;
        playRevealAudio();
    }, [isFlipped, status, playRevealAudio]);

    useEffect(() => {
        loadStats();
        wordsApi.getLanguages().then(setLanguages).catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (status === 'finished' && reviewedCount > 0) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#22c55e', '#3b82f6', '#f59e0b']
            });
        }
    }, [status, reviewedCount]);

    const controls = useAnimation();

    // Idle / Setup
    if (status === 'idle' || status === 'loading') {
        return (
            <div className="container py-8 max-w-2xl mx-auto space-y-8 animate-in fade-in">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Spaced Repetition</h2>
                    <p className="text-muted-foreground">Review words at optimal intervals for long-term memory.</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard icon={<BookOpen className="w-4 h-4" />} label="Total" value={stats.total} />
                        <StatCard icon={<Clock className="w-4 h-4" />} label="Due Now" value={stats.due} accent />
                        <StatCard icon={<Brain className="w-4 h-4" />} label="Learned" value={stats.learned} />
                        <StatCard icon={<Flame className="w-4 h-4" />} label="Today" value={stats.reviewedToday} />
                    </div>
                )}

                {languages.length > 0 && (
                    <div className="flex justify-center gap-3">
                        <select
                            value={sourceLanguage}
                            onChange={(e) => setFilter('sourceLanguage', e.target.value)}
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                        >
                            <option value="">All source languages</option>
                            {[...new Set(languages.map((l) => l.sourceLanguage))].map((lang) => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                        <select
                            value={targetLanguage}
                            onChange={(e) => setFilter('targetLanguage', e.target.value)}
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                        >
                            <option value="">All target languages</option>
                            {[...new Set(languages.map((l) => l.targetLanguage))].map((lang) => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-md bg-destructive/15 text-destructive font-medium flex items-center justify-between">
                        <span>{error}</span>
                        <Button variant="outline" size="sm" onClick={() => { loadStats(); wordsApi.getLanguages().then(setLanguages).catch(() => {}); }}>
                            Retry
                        </Button>
                    </div>
                )}

                <div className="flex justify-center">
                    <Button
                        size="lg"
                        onClick={loadDueWords}
                        disabled={status === 'loading' || (stats?.due === 0)}
                        className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 gap-2"
                    >
                        {status === 'loading' ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                            <Brain className="w-4 h-4" />
                        )}
                        {stats?.due === 0 ? 'All caught up!' : `Start Review (${stats?.due ?? '...'} due)`}
                    </Button>
                </div>
            </div>
        );
    }

    // Finished
    if (status === 'finished') {
        return (
            <div className="container py-8 max-w-2xl mx-auto space-y-8 animate-in fade-in">
                <div className="text-center space-y-4">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Session Complete</h2>
                    <p className="text-muted-foreground">
                        You reviewed <span className="font-semibold text-foreground">{reviewedCount}</span> word{reviewedCount !== 1 ? 's' : ''}.
                    </p>
                </div>

                <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={() => { reset(); loadStats(); }} className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Back
                    </Button>
                    <Button onClick={() => { reset(); loadDueWords(); }} className="gap-2">
                        <Brain className="w-4 h-4" />
                        Continue Reviewing
                    </Button>
                </div>
            </div>
        );
    }

    // Reviewing
    const word = words[currentIndex];
    if (!word) return null;

    const progress = ((currentIndex) / words.length) * 100;
    const revealAudioLabel =
        srsRevealAudioMode === 'none'
            ? 'silent'
            : srsRevealAudioMode === 'source'
                ? 'source'
                : srsRevealAudioMode === 'target'
                    ? 'target'
                    : 'both';

    return (
        <div className="container py-8 max-w-2xl mx-auto space-y-6 animate-in fade-in">
            {/* Progress bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{currentIndex + 1} / {words.length}</span>
                    <span>{reviewedCount} reviewed</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Flashcard */}
            <motion.div
                drag={isFlipped ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.8}
                onDragEnd={async (_, { offset }) => {
                    if (offset.x < -100) {
                        await controls.start({ x: -300, opacity: 0 });
                        submitReview(1);
                        controls.set({ x: 0, opacity: 1 });
                    } else if (offset.x > 100) {
                        await controls.start({ x: 300, opacity: 0 });
                        submitReview(5);
                        controls.set({ x: 0, opacity: 1 });
                    }
                }}
                animate={controls}
                onClick={() => !isFlipped && flipCard()}
                className={`relative min-h-[300px] rounded-xl border-2 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 touch-pan-y
                    ${isFlipped
                        ? 'bg-background border-primary/30 shadow-md'
                        : 'bg-muted/30 border-border hover:border-primary/20 hover:shadow-lg'
                    }`}
            >
                {/* Audio controls — top right */}
                <div className="absolute top-3 right-3 flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full px-2 text-[11px]"
                        onClick={() => {
                            const nextMode = srsRevealAudioMode === 'none'
                                ? 'source'
                                : srsRevealAudioMode === 'source'
                                    ? 'target'
                                    : srsRevealAudioMode === 'target'
                                        ? 'both'
                                        : 'none';
                            setSrsRevealAudioMode(nextMode);
                        }}
                        title="Reveal audio mode: silent/source/target/both"
                    >
                        Reveal: {revealAudioLabel}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => pronounce(word.text, word.sourceLanguage)}
                        title="Pronounce"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 rounded-full ${!audioEnabled ? 'text-muted-foreground/40' : ''}`}
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        title={audioEnabled ? 'Mute audio' : 'Enable audio'}
                    >
                        {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                </div>
                {!isFlipped ? (
                    // Front: show word text
                    <div className="space-y-4 animate-in fade-in">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            {word.sourceLanguage}
                        </p>
                        <h3 className="text-4xl font-bold text-foreground">{word.text}</h3>
                        {word.context && (
                            <p className="text-sm text-muted-foreground italic max-w-md">
                                &ldquo;{word.context}&rdquo;
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-4">Tap to reveal</p>
                    </div>
                ) : (
                    // Back: show definition + details
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            {word.targetLanguage}
                        </p>
                        <h3 className="text-2xl font-bold text-foreground">{word.definition || 'No definition'}</h3>
                        {word.explanation && (
                            <p className="text-sm text-muted-foreground">{word.explanation}</p>
                        )}
                        {word.pronunciation && (
                            <p className="text-sm font-mono text-primary">{word.pronunciation}</p>
                        )}
                        {word.examples && word.examples.length > 0 && (
                            <div className="text-sm text-muted-foreground border-t pt-3 mt-3 space-y-1">
                                {word.examples.slice(0, 2).map((ex) => (
                                    <p key={ex.id} className="italic">{ex.sentence}</p>
                                ))}
                            </div>
                        )}
                        {isFlipped && (
                            <p className="text-[10px] text-muted-foreground opacity-50 absolute bottom-4 left-0 right-0 text-center">
                                Swipe left for Hard, right for Easy
                            </p>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Rating buttons (only when flipped) */}
            {isFlipped && (
                <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-4">
                    <RatingButton
                        label="Again"
                        sublabel={formatInterval(previewSm2Interval(1, word.srsEaseFactor, word.srsInterval, word.srsRepetitions))}
                        quality={1}
                        color="bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/30"
                        onClick={() => submitReview(1)}
                    />
                    <RatingButton
                        label="Hard"
                        sublabel={formatInterval(previewSm2Interval(3, word.srsEaseFactor, word.srsInterval, word.srsRepetitions))}
                        quality={3}
                        color="bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border-orange-500/30"
                        onClick={() => submitReview(3)}
                    />
                    <RatingButton
                        label="Good"
                        sublabel={formatInterval(previewSm2Interval(4, word.srsEaseFactor, word.srsInterval, word.srsRepetitions))}
                        quality={4}
                        color="bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/30"
                        onClick={() => submitReview(4)}
                    />
                    <RatingButton
                        label="Easy"
                        sublabel={formatInterval(previewSm2Interval(5, word.srsEaseFactor, word.srsInterval, word.srsRepetitions))}
                        quality={5}
                        color="bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border-blue-500/30"
                        onClick={() => submitReview(5)}
                    />
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, accent }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    accent?: boolean;
}) {
    return (
        <div className={`rounded-lg border p-4 text-center space-y-1 ${accent ? 'border-primary/30 bg-primary/5' : ''}`}>
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                {icon}
                <span className="text-xs">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>
                {value}
            </p>
        </div>
    );
}

function RatingButton({ label, sublabel, color, onClick }: {
    label: string;
    sublabel: string;
    quality: number;
    color: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`rounded-lg border p-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${color}`}
        >
            <div className="font-semibold text-sm">{label}</div>
            <div className="text-xs opacity-70">{sublabel}</div>
        </button>
    );
}

/** Client-side SM-2 preview — mirrors the server's calculateSm2 exactly. */
function previewSm2Interval(
    quality: number,
    prevEase: number = 2.5,
    prevInterval: number = 0,
    prevReps: number = 0,
): number {
    if (quality < 3) return 0; // 10 minutes (sub-day)

    const newEase = Math.max(
        1.3,
        prevEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    );

    if (prevReps === 0) {
        if (quality === 3) return 1;
        if (quality === 4) return 3;
        return 7; // quality 5
    }
    if (prevReps === 1) {
        if (quality === 3) return 4;
        if (quality === 4) return 6;
        return 10; // quality 5
    }
    // Mature cards
    if (quality === 3) return Math.round(prevInterval * 1.2);
    if (quality === 5) return Math.round(prevInterval * newEase * 1.3);
    return Math.round(prevInterval * newEase); // quality 4
}

function formatInterval(days: number): string {
    if (days <= 0) return '10 min';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} mo`;
    return `${(days / 365).toFixed(1)} yr`;
}
