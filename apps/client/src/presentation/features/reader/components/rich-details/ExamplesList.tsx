import ReactMarkdown from 'react-markdown';
import type { RichTranslationResult } from '../../../../../core/interfaces/IAIService';
import { useAudioStore } from '../../store/useAudioStore';
import { Volume2, AudioLines } from 'lucide-react';

interface ExamplesListProps {
    examples: RichTranslationResult['examples'];
}

export function ExamplesList({ examples }: ExamplesListProps) {
    const activeSingleText = useAudioStore(state => state.activeSingleText);

    if (!examples || examples.length === 0) return null;

    return (
        <div>
            <div className="space-y-3">
                {examples.map((ex, i) => {
                    const isPlayingThis = activeSingleText === ex.sentence;
                    
                    return (
                        <div 
                            key={i} 
                            className="text-sm border-l-2 border-primary pl-3 py-1 group cursor-pointer transition-colors hover:bg-muted/30 rounded-r-md flex items-start justify-between"
                            onClick={() => useAudioStore.getState().playSingle(ex.sentence)}
                        >
                            <div className="flex-1">
                                <div className="italic mb-1 text-foreground prose dark:prose-invert prose-sm prose-p:text-current prose-strong:text-current max-w-none">
                                    <ReactMarkdown>{ex.sentence}</ReactMarkdown>
                                </div>
                                <div className="text-muted-foreground prose dark:prose-invert prose-sm prose-p:text-current prose-strong:text-current max-w-none">
                                    <ReactMarkdown>{ex.translation}</ReactMarkdown>
                                </div>
                            </div>
                            <div className={`p-1.5 rounded-full transition-colors ${isPlayingThis ? 'text-primary bg-primary/10' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`}>
                                {isPlayingThis ? <AudioLines className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
