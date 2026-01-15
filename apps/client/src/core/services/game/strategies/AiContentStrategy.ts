import type { IContentStrategy, GameItem, GameContentParams } from '../interfaces';
import { ollamaService } from '@/infrastructure/ai/OllamaService';

export class AiContentStrategy implements IContentStrategy {
    async validateAvailability(): Promise<boolean> {
        return ollamaService.checkHealth();
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
        const sourceLang = config.language?.source || 'English';
        const targetLang = config.language?.target || 'Spanish';
        const limit = config.limit || 10;
        const mode = config.gameMode || 'multiple-choice';
        const isStoryMode = mode === 'story';

        let prompt = `
        Generate ${limit} vocabulary items or short phrases for a language learning game.
        Topic: "${topic}"
        Difficulty Level: ${level}
        Source Language: ${sourceLang}
        Target Language: ${targetLang}
        
        Game Mode Context: ${mode} (If mode is 'scramble', generate sentences. If 'build-word', simple words).

        Return strictly a JSON array of objects. Each object must have:
        - "question": The word/phrase in ${sourceLang}.
        - "answer": The translation in ${targetLang}.
        - "context": A short example sentence using the word in ${targetLang} (or ${sourceLang} if more appropriate).
        - "type": "word" or "phrase" (based on content).
        `;

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
            prompt += `
             For "scramble" mode, generate ${limit} FULL SENTENCES about "${topic}".
             Level criteria:
             - Beginner: Simple Subject-Verb-Object sentences (5-8 words).
             - Intermediate: Sentences with conjunctions or simple relative clauses (8-12 words).
             - Advanced: Complex sentences with subordinate clauses or idiomatic expressions (12+ words).
             
             Current Level: ${level}

             Return strictly a JSON array of objects. Each object must have:
             - "question": The full sentence in ${sourceLang} (for reference/hint).
             - "answer": The full sentence in ${targetLang} (this will be scrambled).
             - "context": A brief explanation of grammar or context if needed.
             - "type": "phrase"

             Example JSON format:
            [
                { "question": "The cat sleeps on the sofa.", "answer": "El gato duerme en el sofá.", "context": "Simple present tense description.", "type": "phrase" }
            ]
            
            Do not include markdown formatting or explanations. Just the JSON array.
             `;
        } else {
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

            return parsed.map((item: { question: string; answer: string; context?: string; type?: 'word' | 'phrase' }, index: number) => ({
                id: `ai-${Date.now()}-${index}`,
                question: item.question,
                answer: item.answer,
                context: item.context,
                source: 'ai',
                type: item.type || 'word',
                lang: {
                    source: sourceLang,
                    target: targetLang
                }
            }));

        } catch (e) {
            console.error("AI Generation Error", e, responseText);
            throw new Error("Failed to parse AI response. " + (e instanceof Error ? e.message : String(e)));
        }
    }
}
