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

    return (
        <div className="space-y-3">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                    Words Added
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#22c55e' }} />
                    Words Reviewed
                </span>
            </div>

            {/* SVG Bar Chart — reliable rendering */}
            <svg width="100%" viewBox={`0 0 ${data.length * 14} 130`} className="overflow-visible">
                {data.map((day, i) => {
                    const x = i * 14;
                    const barW = 12;
                    const chartH = 120;
                    const total = day.wordsAdded + day.wordsReviewed;
                    const totalH = Math.max((total / maxVal) * chartH, total > 0 ? 4 : 0);
                    const addedH = total > 0 ? (day.wordsAdded / total) * totalH : 0;
                    const reviewedH = total > 0 ? (day.wordsReviewed / total) * totalH : 0;

                    const isToday = day.date === new Date().toISOString().slice(0, 10);

                    return (
                        <g key={day.date}>
                            {/* Background bar for hover area */}
                            <rect x={x} y={0} width={barW} height={chartH} fill="transparent">
                                <title>{`${day.date}: +${day.wordsAdded} added, ${day.wordsReviewed} reviewed`}</title>
                            </rect>
                            {/* Reviewed bar (green, top portion) */}
                            <rect
                                x={x}
                                y={chartH - totalH}
                                width={barW}
                                height={reviewedH}
                                rx={2}
                                fill={isToday ? '#22c55e' : '#22c55e99'}
                            />
                            {/* Added bar (primary/blue, bottom portion) */}
                            <rect
                                x={x}
                                y={chartH - addedH}
                                width={barW}
                                height={addedH}
                                rx={2}
                                fill={isToday ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.7)'}
                            />
                            {/* Empty day line */}
                            {total === 0 && (
                                <rect x={x} y={chartH - 1} width={barW} height={1} rx={0.5} fill="hsl(var(--muted-foreground) / 0.2)" />
                            )}
                        </g>
                    );
                })}
                {/* Bottom axis line */}
                <line x1={0} y1={120} x2={data.length * 14} y2={120} stroke="hsl(var(--border))" strokeWidth={1} />
            </svg>

            {/* X-axis labels */}
            <div className="flex text-[10px] text-muted-foreground" style={{ paddingRight: '2px' }}>
                {data.map((day, i) => {
                    if (i % 7 !== 0) return <span key={day.date} className="flex-1" />;
                    const date = new Date(day.date + 'T00:00:00');
                    return (
                        <span key={day.date} className="flex-1 text-center">
                            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
