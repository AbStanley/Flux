import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/presentation/components/ui/button";
import { Progress } from "@/presentation/components/ui/progress";
import { X, Heart, Trophy, Flame, Timer } from 'lucide-react';
import { useGameStore } from './store/useGameStore';
import { LevelDisplay } from '../../components/gamification/LevelDisplay';
import { cn } from "@/lib/utils";

interface GameShellProps {
    children: React.ReactNode;
}

export function GameShell({ children }: GameShellProps) {
    const { score, streak, health, maxHealth, currentIndex, items, reset, restartGame, status, timeLeft, tick, config, syncProgress } = useGameStore();
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
                <div className="flex flex-col gap-4 items-center">
                    <div className="flex gap-4">
                        <Button size="lg" variant="outline" onClick={reset}>Back to Menu</Button>
                        <Button size="lg" onClick={restartGame}>Play Again</Button>
                    </div>
                    {config.source === 'anki' && (
                        <Button
                            variant="secondary"
                            onClick={async () => {
                                const btn = document.getElementById('anki-sync-btn');
                                if (btn) {
                                    btn.textContent = "Syncing...";
                                    btn.setAttribute('disabled', 'true');
                                }
                                try {
                                    await syncProgress();
                                    if (btn) btn.textContent = "Synced!";
                                } catch {
                                    if (btn) {
                                        btn.textContent = "Failed to Sync";
                                        btn.removeAttribute('disabled');
                                    }
                                }
                            }}
                            id="anki-sync-btn"
                        >
                            Sync to Anki
                        </Button>
                    )}
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
            <header className={cn("border-b bg-card/50 backdrop-blur-sm p-2 sticky top-0 z-10 transition-all duration-300", timerEnabled ? "mt-1.5" : "")}>
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={reset} className="hover:bg-destructive/10 hover:text-destructive h-8 w-8">
                            <X className="w-4 h-4" />
                        </Button>

                        {/* Score & Level Group */}
                        <div className="flex flex-col items-start gap-0.5">
                            <div className="flex items-center gap-1.5 font-bold tabular-nums text-xs ml-1">
                                <Trophy className="w-3 h-3 text-yellow-500" />
                                <span>{score}</span>
                            </div>
                            <div className="scale-90 origin-left">
                                <LevelDisplay />
                            </div>
                        </div>
                    </div>

                    {/* Center: Progress & Timer */}
                    <div className="flex-1 flex flex-col items-center justify-center max-w-[200px] gap-1">
                        <Progress value={progress} className="h-2 w-full" />
                        {/* Timer Numeric Display */}
                        {timerEnabled && (
                            <div className={cn("flex items-center gap-1.5 font-bold tabular-nums text-sm transition-colors",
                                timeLeft <= 30 ? "text-red-500 animate-pulse" : "text-muted-foreground"
                            )}>
                                <Timer className="w-3 h-3" />
                                {Math.ceil(timeLeft / 10)}s
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-1">
                        {streak > 1 && (
                            <div className="hidden sm:flex items-center gap-1 font-bold tabular-nums text-sm text-orange-500 animate-pulse mr-2">
                                <Flame className="w-4 h-4" />
                                {streak}
                            </div>
                        )}
                        <div className="flex gap-0.5">
                            {Array.from({ length: maxHealth }).map((_, i) => (
                                <Heart
                                    key={i}
                                    className={`w-5 h-5 transition-all duration-300 ${i < health ? 'fill-red-500 text-red-500' : 'text-muted-foreground/30 scale-75'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Game Content */}
            <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="w-full h-full"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};
