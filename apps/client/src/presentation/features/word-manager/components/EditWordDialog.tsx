import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { type CreateWordRequest, type Word } from '../../../../infrastructure/api/words';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../components/ui/select";
import { TARGET_LANGUAGES } from "../../../../core/constants/languages";

import { useWordForm } from '../hooks/useWordForm';
import { WordExamplesSection } from './WordExamplesSection';

interface EditWordDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateWordRequest) => Promise<void>;
    initialData?: Word;
    defaultValues?: Partial<CreateWordRequest>;
    defaultType?: 'word' | 'phrase';
}

export function EditWordDialog({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    defaultValues,
    defaultType = 'word'
}: EditWordDialogProps) {
    const {
        formData,
        isLoading,
        isGenerating,
        isValid,
        showLimitWarning,
        handleChange,
        handleAddExample,
        handleExampleChange,
        handleRemoveExample,
        handleGenerateExamples,
        handleSubmit
    } = useWordForm({ initialData, defaultValues, onSubmit, onClose, isOpen, defaultType });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] md:w-full max-w-2xl max-h-[90vh] flex flex-col p-0 md:p-6" aria-describedby={undefined}>
                <DialogHeader className="px-6 py-4 md:px-0 md:py-0 border-b md:border-none">
                    <DialogTitle>{initialData ? 'Edit Word' : 'Add New Word'}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 md:px-0 md:py-2">
                    <form id="word-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="text">Word / Phrase</Label>
                                <Input
                                    id="text"
                                    value={formData.text}
                                    onChange={e => handleChange('text', e.target.value)}
                                    required
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="definition">Definition</Label>
                                <Input
                                    id="definition"
                                    value={formData.definition}
                                    onChange={e => handleChange('definition', e.target.value)}
                                    className="h-10"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sourceLanguage">Foreign Language</Label>
                                <Select
                                    value={formData.sourceLanguage}
                                    onValueChange={(value) => handleChange('sourceLanguage', value)}
                                >
                                    <SelectTrigger id="sourceLanguage" className="h-10">
                                        <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TARGET_LANGUAGES.map((lang) => (
                                            <SelectItem key={lang.value} value={lang.value}>
                                                {lang.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="targetLanguage">Native Language</Label>
                                <Select
                                    value={formData.targetLanguage}
                                    onValueChange={(value) => handleChange('targetLanguage', value)}
                                >
                                    <SelectTrigger id="targetLanguage" className="h-10">
                                        <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TARGET_LANGUAGES.map((lang) => (
                                            <SelectItem key={lang.value} value={lang.value}>
                                                {lang.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pronunciation">Pronunciation</Label>
                                <Input
                                    id="pronunciation"
                                    value={formData.pronunciation}
                                    onChange={e => handleChange('pronunciation', e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sourceTitle">Source Title</Label>
                                <Input
                                    id="sourceTitle"
                                    value={formData.sourceTitle}
                                    onChange={e => handleChange('sourceTitle', e.target.value)}
                                    className="h-10"
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
                                className="h-10"
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

                        <div className="space-y-2">
                            <Label htmlFor="explanation">Explanation</Label>
                            <Textarea
                                id="explanation"
                                value={formData.explanation}
                                onChange={e => handleChange('explanation', e.target.value)}
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
                    </form>
                </div >

                <div className="p-4 md:px-0 md:py-0 border-t md:border-none bg-background md:bg-transparent mt-auto shadow-sm md:shadow-none space-y-2">
                    {!isValid && (
                        <p className="text-xs text-destructive text-right px-2">
                            Please ensure all examples have both a sentence and a translation.
                        </p>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="h-10">
                            Cancel
                        </Button>
                        <Button type="submit" form="word-form" disabled={isLoading || !isValid} className="h-10">
                            {isLoading ? 'Saving...' : 'Save Word'}
                        </Button>
                    </div>
                </div>
            </DialogContent >
        </Dialog >
    );
};
