import { useAudioStore } from '../../store/useAudioStore';
import { Volume2, AudioLines } from 'lucide-react';

interface AlternativesListProps {
    alternatives: string[];
}

export function AlternativesList({ alternatives }: AlternativesListProps) {
    const activeSingleText = useAudioStore(state => state.activeSingleText);

    if (!alternatives || alternatives.length === 0) return null;

    return (
        <div>
            <div className="flex flex-wrap gap-2 mt-1">
                {alternatives.map((alt, i) => {
                    const isPlayingThis = activeSingleText === alt;
                    return (
                        <button 
                            key={i} 
                            onClick={() => useAudioStore.getState().playSingle(alt)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all hover:scale-105 active:scale-95 ${
                                isPlayingThis 
                                    ? 'bg-primary text-primary-foreground shadow-sm' 
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                        >
                            {isPlayingThis ? <AudioLines className="h-3 w-3 animate-pulse" /> : <Volume2 className="h-3 w-3 opacity-70" />}
                            {alt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
