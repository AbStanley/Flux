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
        // In this app's convention (from AiSetup.tsx and DB strategy):
        // sourceLang = Foreign/Learning language
        // targetLang = Native/Translation language
        const learningLang = this.getLanguageName(config.language?.source || 'Spanish');
        const nativeLang = this.getLanguageName(config.language?.target || 'English');

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
            const rawItems = await serverAIService.generateGameContent({
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

            console.log(`[AiStrategy] Received ${rawItems.length} items from AI.`);
            console.log("[AiStrategy] Raw AI items:", rawItems);

            let index = 0;
            for (const rawItem of rawItems) {
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

                // Validate
                if (item.question && item.answer && item.question.toLowerCase().trim() !== item.answer.toLowerCase().trim()) {
                    items.push(item);
                    onItem?.(item);
                } else {
                    console.warn(`[AiStrategy] Filtered item because question and answer are identical or empty in both languages: "${item.question}" vs "${item.answer}"`);
                }
            }

            if (items.length === 0) {
                throw new Error(`AI generated ${rawItems.length} items, but they were all invalid (likely identical in both languages). Try a different model like 'llama3' or check your source/target language settings.`);
            }

            return items;

        } catch (e) {
            console.error("AI Generation Error", e);
            if (items.length > 0) return items;
            throw new Error((e instanceof Error ? e.message : String(e)));
        }
    }
}
