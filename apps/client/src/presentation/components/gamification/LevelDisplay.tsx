import { useUserStats } from '../../features/learning-mode/store/useUserStats';
import { Progress } from "@/presentation/components/ui/progress";
import { Star } from 'lucide-react';

export const LevelDisplay = () => {
    const { level, currentXp, nextLevelXp } = useUserStats();

    // Calculate progress percentage
    const progress = Math.min(100, Math.max(0, (currentXp / nextLevelXp) * 100));

    return (
        <div className="flex items-center gap-3 p-2 bg-muted rounded-lg border border-border shadow-sm">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-yellow-900 font-bold shadow-sm">
                <span className="text-xs">{level}</span>
                <div className="absolute -bottom-1 -right-1">
                    <Star className="w-3 h-3 fill-yellow-600 text-yellow-600" />
                </div>
            </div>

            <div className="flex flex-col w-24">
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                    <span>Lvl {level}</span>
                    <span>{Math.floor(currentXp)} / {nextLevelXp}</span>
                </div>
                <Progress value={progress} className="h-1.5" />
            </div>
        </div>
    );
};
