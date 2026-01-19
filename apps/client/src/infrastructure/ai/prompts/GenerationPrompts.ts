// Define ContentType here or import it if better placed in a types file.
// For simplicity and cohesion, defining it here for now as it's directly used by the prompt generator.
export type ContentType = 'Story' | 'Monologue' | 'Conversation';

export const getStoryPrompt = (
    sourceLang: string,
    isLearningMode: boolean,
    topic: string,
    proficiencyLevel: string,
    contentType: ContentType = 'Story'
): string => {
    let contentDescription = "";
    switch (contentType) {
        case 'Monologue':
            contentDescription = "a monologue";
            break;
        case 'Conversation':
            contentDescription = "a conversation between two people";
            break;
        case 'Story':
        default:
            contentDescription = "a short story";
            break;
    }

    if (isLearningMode) {
        const topicPhrase = topic ? ` about "${topic}"` : " about a random interesting topic";
        return `Write ${contentDescription} about ${topicPhrase} in ${sourceLang} suitable for a ${proficiencyLevel} proficiency level learner. The vocabulary and grammar should be appropriate for ${proficiencyLevel}. Include a title starting with '## '. Output ONLY the title and the text. Do not include any introductory or concluding remarks. Do NOT include translations.`;
    } else {
        // Fallback or non-learning mode default (though 'isLearningMode' seems strictly coupled to 'Story' in previous logic, we'll adapt it)
        return `Write ${contentDescription} in ${sourceLang} about a robot learning to paint. Include a title starting with '## '. Output ONLY the title and the text. Do not include any introductory or concluding remarks. Do NOT include translations.`;
    }
};
