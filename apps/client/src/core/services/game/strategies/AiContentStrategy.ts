import type { IContentStrategy, GameItem, GameContentParams } from '../interfaces';
import { ollamaService } from '@/infrastructure/ai/OllamaService';
import { normalizeLanguageCode } from '../../../utils/language';
import { COMMON_LANGUAGES } from '@/presentation/features/learning-mode/components/setup/LanguageSelector.constants';

export class AiContentStrategy implements IContentStrategy {
    async validateAvailability(): Promise<boolean> {
        return ollamaService.checkHealth();
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

        // Set base URL if provided in config (for Docker/remote Ollama)
        if (config.aiHost) {
            ollamaService.setBaseUrl(config.aiHost);
        }

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
        const isStoryMode = mode === 'story';


        const contextInstruction = mode === 'scramble'
            ? 'Generate FULL SENTENCES.'
            : 'Generate simple words or short phrases.';

        let prompt = `
        Generate ${limit} items for a language learning game.
        Topic: "${topic}"
        Difficulty Level: ${level}
        Game Mode: ${mode} (${contextInstruction})

        Return strictly a JSON array of objects. Each object must have:
        - "question": The content in ${sourceLang}.
        - "answer": The translation in ${targetLang}.
        - "context": A short example sentence using the word in ${targetLang}.
        - "type": "word" or "phrase".

        IMPORTANT criteria:
        1. "question" and "answer" must be in the specified languages.
        2. "question" and "answer" must NOT be identical (unless the word is the same in both languages, which should be rare).
        3. Avoid proper nouns if they don't change between languages.
        `;

        // Story mode override
        if (isStoryMode) {
            prompt = `
            Generate a short cohesive story about "${topic}" in ${targetLang} (Level: ${level}).
            Split the story into ${limit} short segments.
            for each segment, identify a key phrase or word to translate to ${sourceLang}.

            Return strictly a JSON array of objects. Each object must have:
            - "context": The story segment in ${targetLang}.
            - "question": The key phrase/word in ${targetLang} (from the segment).
            - "answer": The translation of the key phrase/word in ${sourceLang}.
            - "type": "phrase"
            
            Example JSON format:
            [
                { "context": "Había una vez un gato.", "question": "gato", "answer": "cat", "type": "phrase" }
            ]

            Do not include markdown. Just JSON.
            `;
        } else if (mode === 'scramble') {
            prompt = `
             For "scramble" mode, generate ${limit} FULL SENTENCES about "${topic}".
             Level criteria:
             - Beginner: Simple Subject-Verb-Object sentences (5-8 words).
             - Intermediate: Sentences with conjunctions or simple relative clauses (8-12 words).
             - Advanced: Complex sentences with subordinate clauses or idiomatic expressions (12+ words).
             
             Current Level: ${level}

             Return strictly a JSON array of objects. Each object must have:
             - "question": The full sentence in ${targetLang} (for reference/hint).
             - "answer": The full sentence in ${sourceLang} (this will be scrambled).
             - "context": A brief explanation of grammar or context if needed.
             - "type": "phrase"

             Example JSON format:
            [
                { "question": "The cat sleeps on the sofa.", "answer": "El gato duerme en el sofá.", "context": "Simple present tense description.", "type": "phrase" }
            ]
            
            Do not include markdown formatting or explanations. Just the JSON array.
             `;
        }

        // Add Example for default/dictation/build-word
        if (!isStoryMode && mode !== 'scramble') {
            prompt += `
             Example JSON format:
            [
                { "question": "Hello", "answer": "Hola", "context": "Hola, ¿cómo estás?", "type": "word" }
            ]
            
            Do not include markdown formatting or explanations. Just the JSON array.
             `;
        }

        const aiModel = config.aiModel;
        const responseText = await ollamaService.generateText(prompt, aiModel ? { model: aiModel } : undefined);

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
