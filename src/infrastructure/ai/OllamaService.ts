import type { IAIService } from '../../core/interfaces/IAIService';

export class OllamaService implements IAIService {
    private baseUrl: string;
    private model: string;

    constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama2') {
        this.baseUrl = baseUrl;
        this.model = model;
    }

    async generateText(prompt: string): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Ollama generation failed:', error);
            throw error;
        }
    }

    async translateText(text: string, targetLanguage: string = 'en', context?: string, sourceLanguage?: string): Promise<string> {
        // Ollama translation usually requires a specific prompt engineering or a translation model.
        // DEBUGGING: Log parameters
        console.log(`[OllamaService] translateText`, { text, target: targetLanguage, source: sourceLanguage });

        const fromLang = (sourceLanguage && sourceLanguage !== 'Auto') ? `from ${sourceLanguage} ` : '';

        // Dictionary-style prompt to force isolation
        let prompt = `Role: Dictionary and Translation Engine.
Task: Provide the meaning of a specific text segment ${fromLang}into ${targetLanguage}.

Input Data:
- Full Sentence (Context): "${context || 'None'}"
- Segment to Translate: "${text}"

Instructions:
1. Look at the "Segment to Translate".
2. Identify its meaning within the "Full Sentence".
3. Negation Check: If the segment itself does not contain "no"/"not", the translation MUST be positive.
4. Preposition Check: If the segment does not include a preposition, do not add one.
5. Return ONLY the translation of the segment.

Examples:
Input: Context="yo no veo donde estas", Segment="estas"
Output: you are

Input: Context="yo no veo donde estas", Segment="donde estas"
Output: where you are

Input: Context="para todos ustedes", Segment="todos ustedes"
Output: all of you

Input: Context="hasta aqui ya no se que hacer", Segment="se que hacer"
Output: know what to do

Input: Context="I like to run", Segment="run"
Output: corrrer

Required Output:
(Just the translation text)`;

        if (context) {
            prompt += `\n\nContext: "${context}"`;
            prompt += `\nTarget Text: "${text}"`;
        } else {
            prompt += `\n\nTarget Text: "${text}"`;
        }

        const rawResponse = await this.generateText(prompt);

        // Post-processing to remove <think> blocks and whitespace
        return rawResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    }

    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.models?.map((m: any) => m.name) || [];
        } catch (error) {
            console.error('Failed to fetch Ollama models:', error);
            return [];
        }
    }

    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`); // Simple endpoint to check connectivity
            return response.ok;
        } catch {
            return false;
        }
    }
}
