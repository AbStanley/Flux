import { useState, useEffect } from 'react';
import { type CreateWordRequest, type Word } from '../../../../infrastructure/api/words';

const DEFAULT_FORM_STATE: CreateWordRequest = {
    text: '',
    definition: '',
    context: '',
    imageUrl: '',
    pronunciation: '',
    sourceTitle: '',
    examples: []
};

interface UseWordFormProps {
    initialData?: Word;
    onSubmit: (data: CreateWordRequest) => Promise<void>;
    onClose: () => void;
    isOpen: boolean;
}

export const useWordForm = ({ initialData, onSubmit, onClose, isOpen }: UseWordFormProps) => {
    const [formData, setFormData] = useState<CreateWordRequest>(DEFAULT_FORM_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [showLimitWarning, setShowLimitWarning] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Map existing word to form DTO
                setFormData({
                    text: initialData.text,
                    definition: initialData.definition || '',
                    context: initialData.context || '',
                    imageUrl: initialData.imageUrl || '',
                    pronunciation: initialData.pronunciation || '',
                    sourceTitle: initialData.sourceTitle || '',
                    sourceLanguage: initialData.sourceLanguage || '',
                    targetLanguage: initialData.targetLanguage || '',
                    examples: initialData.examples?.map(ex => ({
                        sentence: ex.sentence,
                        translation: ex.translation || ''
                    })) || []
                });
            } else {
                setFormData(DEFAULT_FORM_STATE);
            }
        }
    }, [isOpen, initialData]);

    const handleChange = (field: keyof CreateWordRequest, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddExample = () => {
        if ((formData.examples?.length || 0) >= 3) {
            setShowLimitWarning(true);
            return;
        }
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

    return {
        formData,
        isLoading,
        showLimitWarning,
        handleChange,
        handleAddExample,
        handleExampleChange,
        handleRemoveExample,
        handleSubmit
    };
};
