import { useState } from 'react';
import { type CreateWordRequest, type Word } from '../../../../infrastructure/api/words';
import { ollamaApi } from '../../../../infrastructure/api/ollama';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

const DEFAULT_FORM_STATE: CreateWordRequest = {
    text: '',
    definition: '',
    explanation: '',
    context: '',
    imageUrl: '',
    pronunciation: '',
    sourceTitle: '',
    examples: [],
    type: 'word'
};

interface UseWordFormProps {
    initialData?: Word;
    defaultValues?: Partial<CreateWordRequest>;
    onSubmit: (data: CreateWordRequest) => Promise<void>;
    onClose: () => void;
    isOpen: boolean;
    defaultType?: 'word' | 'phrase';
}

export const useWordForm = ({ initialData, defaultValues, onSubmit, onClose, isOpen, defaultType = 'word' }: UseWordFormProps) => {
    const [formData, setFormData] = useState<CreateWordRequest>({ ...DEFAULT_FORM_STATE, type: defaultType });
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showLimitWarning, setShowLimitWarning] = useState(false);
    const aiModel = useSettingsStore((s) => s.llmModel);

    const [wasOpen, setWasOpen] = useState(false);
    if (isOpen !== wasOpen) {
        setWasOpen(isOpen);
        if (isOpen) {
            if (initialData) {
                // Map existing word to form DTO
                setFormData({
                    text: initialData.text,
                    definition: initialData.definition || '',
                    explanation: initialData.explanation || '',
                    context: initialData.context || '',
                    imageUrl: initialData.imageUrl || '',
                    pronunciation: initialData.pronunciation || '',
                    sourceTitle: initialData.sourceTitle || '',
                    sourceLanguage: initialData.sourceLanguage || '',
                    targetLanguage: initialData.targetLanguage || '',
                    type: initialData.type || 'word',
                    examples: initialData.examples?.map(ex => ({
                        sentence: ex.sentence,
                        translation: ex.translation || ''
                    })) || []
                });
            } else if (defaultValues) {
                setFormData({ ...DEFAULT_FORM_STATE, type: defaultType, ...defaultValues });
            } else {
                setFormData({ ...DEFAULT_FORM_STATE, type: defaultType });
            }
        }
    }

    const handleChange = (field: keyof CreateWordRequest, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddExample = () => {
        setFormData(prev => ({
            ...prev,
            examples: [...(prev.examples || []), { sentence: '', translation: '' }]
        }));
        setShowLimitWarning(false);
    };

    const handleExampleChange = (index: number, field: 'sentence' | 'translation', value: string) => {
        setFormData(prev => ({
            ...prev,
            examples: prev.examples?.map((ex, i) =>
                i === index ? { ...ex, [field]: value } : ex
            )
        }));
    };

    const handleRemoveExample = (index: number) => {
        setFormData(prev => ({
            ...prev,
            examples: prev.examples?.filter((_, i) => i !== index)
        }));
        setShowLimitWarning(false);
    };

    const handleGenerateExamples = async () => {
        if (!formData.text || !formData.sourceLanguage || !formData.targetLanguage) {
            console.warn('Need word text and languages to generate examples');
            return;
        }

        const currentExamples = formData.examples || [];

        setIsGenerating(true);
        try {
            // Extract existing sentences to exclude them from regeneration
            const existingSentencesList = currentExamples
                .map(ex => ex.sentence.trim())
                .filter(Boolean);

            const generated = await ollamaApi.generateExamples({
                word: formData.text,
                definition: formData.definition,
                sourceLanguage: formData.sourceLanguage,
                targetLanguage: formData.targetLanguage,
                count: 3,
                existingExamples: existingSentencesList,
                model: aiModel || undefined,
            });

            console.log('AI Generated Examples:', generated);

            const existingSentencesSet = new Set(existingSentencesList.map(s => s.toLowerCase()));

            const generatedExamples = (generated || []).map((ex) => ({
                sentence: ex.sentence || '',
                translation: ex.translation || ''
            }));

            // Filter out duplicates if any were still generated
            const uniqueGenerated = generatedExamples.filter(
                ex => !existingSentencesSet.has(ex.sentence.toLowerCase().trim())
            );

            // Filter out empty existing examples first, then append unique newly generated ones
            const cleanedCurrent = currentExamples.filter(ex => ex.sentence.trim());
            const finalExamples = [...cleanedCurrent, ...uniqueGenerated];

            console.log('Final merged examples:', finalExamples);

            setFormData(prev => ({
                ...prev,
                examples: finalExamples
            }));
            setShowLimitWarning(false);
        } catch (error) {
            console.error('Failed to generate examples:', error);
            alert('Failed to generate examples. Make sure Ollama is running and has a model available (e.g., run: ollama pull llama3.2)');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const isValid = formData.text.trim() !== '' && (
        !formData.examples ||
        formData.examples.length === 0 ||
        formData.examples.every(ex => ex.sentence?.trim() !== '' && ex.translation?.trim() !== '')
    );

    return {
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
    };
};
