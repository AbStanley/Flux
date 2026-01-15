import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { type CreateWordRequest, type Word } from '../../../../infrastructure/api/words';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { useWordForm } from '../hooks/useWordForm';
import { WordExamplesSection } from './WordExamplesSection';

interface EditWordDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateWordRequest) => Promise<void>;
    initialData?: Word;
}

export function EditWordDialog({
    isOpen,
    onClose,
    onSubmit,
    initialData
}: EditWordDialogProps) {
    const {
        formData,
        isLoading,
        isGenerating,
        showLimitWarning,
        handleChange,
        handleAddExample,
        handleExampleChange,
        handleRemoveExample,
        handleGenerateExamples,
        handleSubmit
    } = useWordForm({ initialData, onSubmit, onClose, isOpen });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Word' : 'Add New Word'}</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                    <form onSubmit={handleSubmit} className="space-y-4 p-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="text">Word / Phrase</Label>
                                <Input
                                    id="text"
                                    value={formData.text}
                                    onChange={e => handleChange('text', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="definition">Definition</Label>
                                <Input
                                    id="definition"
                                    value={formData.definition}
                                    onChange={e => handleChange('definition', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pronunciation">Pronunciation</Label>
                                <Input
                                    id="pronunciation"
                                    value={formData.pronunciation}
                                    onChange={e => handleChange('pronunciation', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sourceTitle">Source Title</Label>
                                <Input
                                    id="sourceTitle"
                                    value={formData.sourceTitle}
                                    onChange={e => handleChange('sourceTitle', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Image URL</Label>
                            <Input
                                id="imageUrl"
                                value={formData.imageUrl}
                                onChange={e => handleChange('imageUrl', e.target.value)}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="context">Context</Label>
                            <Textarea
                                id="context"
                                value={formData.context}
                                onChange={e => handleChange('context', e.target.value)}
                                rows={2}
                            />
                        </div>

                        <WordExamplesSection
                            examples={formData.examples}
                            onAdd={handleAddExample}
                            onChange={handleExampleChange}
                            onRemove={handleRemoveExample}
                            onGenerate={handleGenerateExamples}
                            isGenerating={isGenerating}
                            canGenerate={!!(formData.text && formData.sourceLanguage && formData.targetLanguage)}
                            showLimitWarning={showLimitWarning}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Word'}
                            </Button>
                        </div>
                    </form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
