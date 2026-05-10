import type { IContentStrategy, GameItem, GameContentParams } from '../interfaces';
import { serverAIService } from '@/infrastructure/ai/ServerAIService';
import { normalizeLanguageCode } from '../../../utils/language';
import { COMMON_LANGUAGES } from '@/presentation/features/learning-mode/components/setup/LanguageSelector.constants';

export class AiContentStrategy implements IContentStrategy {
    async validateAvailability(): Promise<boolean> {
        return serverAIService.checkHealth();
    }

    // Helper to get full name from code
    private getLanguageName(code: string): string {
        const found = COMMON_LANGUAGES.find(l => l.code === code.toLowerCase());
        return found ? found.name : code;
    }

    async fetchItems(config: GameContentParams['config'], onItem?: (item: GameItem) => void): Promise<GameItem[]> {
        if (config?.gameMode !== 'conjugation' && !config?.aiTopic) {
            throw new Error("Topic is required for AI strategy.");
        }

        const topic = config.aiTopic || 'Verbs';
        const level = config.aiLevel || 'intermediate';
        // Corrected mapping to match AiSetup.tsx:
        // config.language.target = Foreign/Practice language
        // config.language.source = Native/Reference language
        const learningLang = this.getLanguageName(config.language?.target || 'English');
        const nativeLang = this.getLanguageName(config.language?.source || 'Spanish');

        const limit = config.limit || 10;
        const mode = config.gameMode || 'multiple-choice';

        const aiModel = config.aiModel;
        if (aiModel) {
            serverAIService.setModel(aiModel);
        }

        const learningLangCode = normalizeLanguageCode(learningLang);
        const nativeLangCode = normalizeLanguageCode(nativeLang);

        const items: GameItem[] = [];
        try {
            const stream = serverAIService.generateGameContentStream({
                topic,
                level,
                mode,
                sourceLanguage: nativeLang,
                targetLanguage: learningLang,
                sourceLangCode: nativeLangCode,
                targetLangCode: learningLangCode,
                limit,
                verb: config.aiVerb,
                tense: config.aiTense
            });

            let index = 0;
            for await (const rawItem of stream) {
                const ri = rawItem as Record<string, unknown>;
                const q = ri.source_translation as string || ri.question as string;
                const a = ri.target_text as string || ri.answer as string;
                const qCode = (ri.source_lang_code as string) || nativeLangCode;
                const aCode = (ri.target_lang_code as string) || learningLangCode;

                const item: GameItem = {
                    id: `ai-${Date.now()}-${index++}`,
                    question: q,
                    answer: a,
                    context: rawItem.context as string,
                    source: 'ai',
                    type: (ri.type as 'word' | 'phrase') || 'word',
                    lang: {
                        source: qCode,
                        target: aCode
                    }
                };

                if (item.question && item.answer && item.question.toLowerCase().trim() !== item.answer.toLowerCase().trim()) {
                    items.push(item);
                    onItem?.(item);
                }
            }

            if (items.length === 0) {
                throw new Error(`AI failed to generate valid items.`);
            }

            return items;

        } catch (e) {
            console.error("AI Generation Error", e);
            if (items.length > 0) return items;
            throw new Error((e instanceof Error ? e.message : String(e)));
        }
    }
}
