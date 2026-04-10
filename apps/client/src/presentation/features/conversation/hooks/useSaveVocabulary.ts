import { useState } from 'react';
import { wordsApi } from '../../../../infrastructure/api/words';

interface SaveParams {
    text: string;
    definition: string;
    context?: string;
    explanation?: string;
    sourceLanguage: string;
    targetLanguage: string;
}

export function useSaveVocabulary() {
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async (params: SaveParams) => {
        if (saving || saved) return;
        setSaving(true);
        try {
            await wordsApi.create({
                text: params.text,
                definition: params.definition,
                context: params.context,
                explanation: params.explanation,
                sourceLanguage: params.sourceLanguage,
                targetLanguage: params.targetLanguage,
                sourceTitle: 'Conversation Practice',
            });
            setSaved(true);
        } catch {
            // silently fail
        } finally {
            setSaving(false);
        }
    };

    return { saved, saving, handleSave };
}
