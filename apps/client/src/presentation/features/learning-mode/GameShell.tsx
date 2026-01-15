import { useEffect } from 'react';
import { Button } from "@/presentation/components/ui/button";
import { Progress } from "@/presentation/components/ui/progress";
import { X, Heart, Trophy, Flame, Timer } from 'lucide-react';
import { useGameStore } from './store/useGameStore';
import { cn } from "@/lib/utils";

interface GameShellProps {
    children: React.ReactNode;
}

export function GameShell({ children }: GameShellProps) {
    const { score, streak, health, maxHealth, currentIndex, items, reset, restartGame, status, timeLeft, tick, config } = useGameStore();
    const timerEnabled = config.timerEnabled;

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'playing' && timerEnabled) {
            interval = setInterval(tick, 100);
        }
        return () => clearInterval(interval);
    }, [status, tick, timerEnabled]);

    if (status === 'finished') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 space-y-8 animate-in zoom-in-95">
                <Trophy className="w-24 h-24 text-yellow-500 mb-4" />
                <h1 className="text-5xl font-extrabold tracking-tight">Game Over!</h1>
                <div className="text-center space-y-2">
                    <p className="text-2xl text-muted-foreground">Final Score</p>
                    <p className="text-6xl font-black text-primary">{score}</p>
                </div>
                <div className="flex items-center gap-4 text-xl">
                    <div className="flex items-center gap-2 text-orange-500 font-bold">
                        <Flame /> {streak} Max Streak
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button size="lg" variant="outline" onClick={reset}>Back to Menu</Button>
                    <Button size="lg" onClick={restartGame}>Play Again</Button>
                </div>
            </div>
        );
    }

    const progress = items.length > 0 ? ((currentIndex) / items.length) * 100 : 0;
    const timeProgress = timeLeft; // Max is 100

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Timer Bar (Top) - Only show if timerEnabled */}
            {timerEnabled && (
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/10 z-50">
                    <div
                        className={cn(
                            "h-full ease-linear",
                            timeLeft === 100 ? "transition-none" : "transition-all duration-100",
                            timeLeft > 50 ? "bg-primary" : timeLeft > 20 ? "bg-orange-500" : "bg-red-500"
                        )}
                        style={{ width: `${timeProgress}%` }}
                    />
                </div>
            )}

            {/* Header HUD */}
            <header className={cn("border-b bg-card/50 backdrop-blur-sm p-4 sticky top-0 z-10 transition-all duration-300", timerEnabled ? "mt-1.5" : "")}>
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 w-1/4">
                        <Button variant="ghost" size="icon" onClick={reset} className="hover:bg-destructive/10 hover:text-destructive">
                            <X className="w-5 h-5" />
                        </Button>
                        <Progress value={progress} className="h-2 flex-1" />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1.5 font-bold tabular-nums text-xl">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            {score}
                        </div>

                        {/* Timer Numeric Display */}
                        {timerEnabled && (
                            <div className={cn("hidden md:flex items-center gap-1.5 font-bold tabular-nums text-xl transition-colors",
                                timeLeft <= 30 ? "text-red-500 animate-pulse" : "text-muted-foreground"
                            )}>
                                <Timer className="w-5 h-5" />
                                {Math.ceil(timeLeft / 10)}s
                            </div>
                        )}

                        {streak > 1 && (
                            <div className="flex items-center gap-1.5 font-bold tabular-nums text-xl text-orange-500 animate-pulse">
                                <Flame className="w-5 h-5" />
                                {streak}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-1 w-1/4">
                        {Array.from({ length: maxHealth }).map((_, i) => (
                            <Heart
                                key={i}
                                className={`w-6 h-6 transition-all duration-300 ${i < health ? 'fill-red-500 text-red-500' : 'text-muted-foreground/30 scale-75'}`}
                            />
                        ))}
                    </div>
                </div>
            </header>

            {/* Game Content */}
            <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4">
                {children}
            </main>
        </div>
    );
};
