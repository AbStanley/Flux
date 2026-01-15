import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { type CreateWordRequest } from '../../../../infrastructure/api/words';

interface WordExamplesSectionProps {
    examples: CreateWordRequest['examples'];
    onAdd: () => void;
    onChange: (index: number, field: 'sentence' | 'translation', value: string) => void;
    onRemove: (index: number) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    canGenerate: boolean;
    showLimitWarning: boolean;
}

export function WordExamplesSection({
    examples,
    onAdd,
    onChange,
    onRemove,
    onGenerate,
    isGenerating,
    canGenerate,
    showLimitWarning
}: WordExamplesSectionProps) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>Examples</Label>
                <div className="flex gap-2 items-center">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onGenerate}
                        disabled={!canGenerate || isGenerating}
                        title={!canGenerate ? "Fill in word and languages first" : "Generate examples with AI"}
                    >
                        {isGenerating ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4 mr-1" />
                        )}
                        {isGenerating ? 'Generating...' : 'AI Generate'}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={onAdd}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                    </Button>
                </div>
            </div>
            {showLimitWarning && (
                <span className="text-xs text-destructive">
                    Maximum 3 examples allowed
                </span>
            )}
            <div className="space-y-3">
                {examples?.map((ex, idx) => (
                    <div key={idx} className="flex gap-2 items-start border p-2 rounded-md bg-muted/20 relative">
                        <div className="flex-1 space-y-2">
                            <Input
                                placeholder="Sentence"
                                value={ex.sentence}
                                onChange={e => onChange(idx, 'sentence', e.target.value)}
                            />
                            <Input
                                placeholder="Translation"
                                value={ex.translation}
                                onChange={e => onChange(idx, 'translation', e.target.value)}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => onRemove(idx)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {(!examples || examples.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">No examples added. Use AI Generate or add manually.</p>
                )}
            </div>
        </div>
    );
};

