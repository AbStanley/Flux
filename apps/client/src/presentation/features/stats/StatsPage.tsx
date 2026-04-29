import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { statsApi, type StatsOverview, type DailyActivity } from '../../../infrastructure/api/stats';
import { BookOpen, Brain, ChevronLeft, ChevronRight, Clock, Flame, Globe, MessageSquare, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatsPage() {
    const [overview, setOverview] = useState<StatsOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        statsApi.getOverview()
            .then(setOverview)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="container py-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
            </div>
        );
    }

    if (!overview) return null;

    return (
        <div className="container py-8 max-w-4xl mx-auto space-y-8 animate-in fade-in">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">Your learning progress at a glance.</p>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    icon={<BookOpen className="w-4 h-4" />}
                    label="Words"
                    value={overview.totalWords}
                />
                <StatCard
                    icon={<MessageSquare className="w-4 h-4" />}
                    label="Phrases"
                    value={overview.totalPhrases}
                />
                <StatCard
                    icon={<Flame className="w-4 h-4" />}
                    label="Streak"
                    value={`${overview.streakDays}d`}
                    accent
                />
                <StatCard
                    icon={<Clock className="w-4 h-4" />}
                    label="Due Today"
                    value={overview.srs.due}
                    accent={overview.srs.due > 0}
                />
            </div>

            {/* SRS Overview */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Brain className="w-5 h-5" />
                        Spaced Repetition
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold">{overview.srs.total}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-orange-500">{overview.srs.due}</p>
                            <p className="text-xs text-muted-foreground">Due</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-500">{overview.srs.learned}</p>
                            <p className="text-xs text-muted-foreground">Learned</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-500">{overview.srs.reviewedToday}</p>
                            <p className="text-xs text-muted-foreground">Today</p>
                        </div>
                    </div>
                    {overview.srs.total > 0 && (
                        <div className="mt-4 h-3 bg-muted rounded-full overflow-hidden flex">
                            <div
                                className="bg-green-500 transition-all"
                                style={{ width: `${(overview.srs.learned / overview.srs.total) * 100}%` }}
                                title={`${overview.srs.learned} learned`}
                            />
                            <div
                                className="bg-orange-500 transition-all"
                                style={{ width: `${(overview.srs.due / overview.srs.total) * 100}%` }}
                                title={`${overview.srs.due} due`}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Activity Chart */}
            <Card>
                <CardContent className="pt-6">
                    <PaginatedActivityChart />
                </CardContent>
            </Card>

            {/* Language Breakdown */}
            {overview.languages.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Globe className="w-5 h-5" />
                            Languages
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {overview.languages.map((lang, i) => {
                                const total = overview.totalWords + overview.totalPhrases;
                                const pct = total > 0 ? (lang.count / total) * 100 : 0;
                                return (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{lang.source} → {lang.target}</span>
                                            <span className="text-muted-foreground">{lang.count} words</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, accent }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    accent?: boolean;
}) {
    return (
        <div className={cn(
            "rounded-lg border p-4 text-center space-y-1",
            accent && "border-primary/30 bg-primary/5"
        )}>
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                {icon}
                <span className="text-xs">{label}</span>
            </div>
            <p className={cn("text-2xl font-bold", accent ? "text-primary" : "text-foreground")}>
                {value}
            </p>
        </div>
    );
}

const PAGE_DAYS = 30;

function PaginatedActivityChart() {
    const [data, setData] = useState<DailyActivity[]>([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchPage = useCallback((newOffset: number) => {
        setLoading(true);
        statsApi.getActivity(PAGE_DAYS, newOffset)
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        // Initial load — offset is already 0
        let cancelled = false;
        statsApi.getActivity(PAGE_DAYS, 0)
            .then(d => { if (!cancelled) setData(d); })
            .catch(console.error)
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const goBack = () => {
        const next = offset + PAGE_DAYS;
        setOffset(next);
        fetchPage(next);
    };

    const goForward = () => {
        const next = Math.max(0, offset - PAGE_DAYS);
        setOffset(next);
        fetchPage(next);
    };

    const rangeEnd = new Date();
    rangeEnd.setDate(rangeEnd.getDate() - offset);
    const rangeStart = new Date(rangeEnd);
    rangeStart.setDate(rangeStart.getDate() - PAGE_DAYS);

    const label = `${rangeStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — ${rangeEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return (
        <div className="space-y-3">
            {/* Header with navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold">
                    <TrendingUp className="w-5 h-5" />
                    Activity
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goBack}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[180px] text-center">{label}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goForward} disabled={offset === 0}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
            ) : (
                <ActivityChart data={data} />
            )}
        </div>
    );
}

function ActivityChart({ data }: { data: DailyActivity[] }) {
    if (data.length === 0) {
        return <p className="text-muted-foreground text-center py-8">No activity yet.</p>;
    }

    const maxVal = Math.max(...data.map(d => d.wordsAdded + d.wordsReviewed), 1);
    const hasAnyData = data.some(d => d.wordsAdded > 0 || d.wordsReviewed > 0);

    if (!hasAnyData) {
        return <p className="text-muted-foreground text-center py-8">No activity in the last 30 days.</p>;
    }

    const getIntensityClass = (total: number) => {
        if (total === 0) return 'bg-muted/30';
        const ratio = total / maxVal;
        if (ratio < 0.25) return 'bg-primary/30';
        if (ratio < 0.5) return 'bg-primary/50';
        if (ratio < 0.75) return 'bg-primary/75';
        return 'bg-primary';
    };

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-muted/30" />
                    <div className="w-3 h-3 rounded-sm bg-primary/30" />
                    <div className="w-3 h-3 rounded-sm bg-primary/50" />
                    <div className="w-3 h-3 rounded-sm bg-primary/75" />
                    <div className="w-3 h-3 rounded-sm bg-primary" />
                </div>
                <span>More</span>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 sm:gap-2">
                {data.map((day) => {
                    const total = day.wordsAdded + day.wordsReviewed;
                    const dateObj = new Date(day.date + 'T00:00:00');
                    const isToday = day.date === new Date().toISOString().slice(0, 10);
                    
                    return (
                        <div 
                            key={day.date} 
                            className={cn(
                                "aspect-square rounded-sm transition-all hover:scale-110 cursor-pointer",
                                getIntensityClass(total),
                                isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                            )}
                            title={`${dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${total} total activity (${day.wordsAdded} added, ${day.wordsReviewed} reviewed)`}
                        />
                    );
                })}
            </div>
        </div>
    );
}
