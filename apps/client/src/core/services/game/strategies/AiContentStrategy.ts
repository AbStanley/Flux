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

    async fetchItems(config: GameContentParams['config']): Promise<GameItem[]> {
        if (!config?.aiTopic) {
            throw new Error("Topic is required for AI strategy.");
        }

        // Set base URL if provided in config (not supported in serverAIService yet via config, assuming default or global set)
        // If config.aiHost is important, we might need to expose setBaseUrl in ServerAIService

        const topic = config.aiTopic;
        const level = config.aiLevel || 'intermediate';

        // Resolve full names for the prompt
        const sourceLang = this.getLanguageName(config.language?.source || 'English');
        let targetLang = this.getLanguageName(config.language?.target || 'Spanish');

        // Ensure source and target are not the same
        if (sourceLang.toLowerCase() === targetLang.toLowerCase()) {
            console.warn(`Source and Target languages are the same (${sourceLang}). Defaulting Target to English (or Spanish if source is English).`);
            targetLang = sourceLang.toLowerCase() === 'english' ? 'Spanish' : 'English';
        }

        const limit = config.limit || 10;
        const mode = config.gameMode || 'multiple-choice';

        const aiModel = config.aiModel;
        if (aiModel) {
            serverAIService.setModel(aiModel);
        }

        const responseText = await serverAIService.generateGameContent({
            topic,
            level,
            mode,
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            limit
        });

        try {
            // Basic cleanup to find JSON array
            const jsonStart = responseText.indexOf('[');
            const jsonEnd = responseText.lastIndexOf(']') + 1;

            if (jsonStart === -1 || jsonEnd === 0) {
                throw new Error("Invalid format from AI");
            }

            const cleanJson = responseText.slice(jsonStart, jsonEnd);
            const parsed = JSON.parse(cleanJson);

            const filtered = parsed.map((item: { question: string; answer: string; context?: string; type?: 'word' | 'phrase' }, index: number) => ({
                id: `ai-${Date.now()}-${index}`,
                question: item.question,
                answer: item.answer,
                context: item.context,
                source: 'ai',
                type: item.type || 'word',
                lang: {
                    source: normalizeLanguageCode(mode === 'scramble' ? targetLang : sourceLang),
                    target: normalizeLanguageCode(mode === 'scramble' ? sourceLang : targetLang)
                }
            })).filter((item: GameItem) => {
                const isValid = item.question && item.answer && item.question.toLowerCase() !== item.answer.toLowerCase();
                if (!isValid) console.warn("[AiStrategy] Filtered invalid/duplicate item:", item);
                return isValid;
            });

            if (filtered.length === 0) {
                throw new Error(`AI generated ${parsed.length} items but all were invalid or identical question/answers. Try a different topic or model.`);
            }

            return filtered;

        } catch (e) {
            console.error("AI Generation Error", e, responseText);
            throw new Error((e instanceof Error ? e.message : String(e)));
        }
    }
}
