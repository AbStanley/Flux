export const getStoryPrompt = (
    sourceLang: string,
    isLearningMode: boolean,
    topic: string,
    proficiencyLevel: string
): string => {
    if (isLearningMode) {
        const topicPhrase = topic ? ` about "${topic}"` : " about a random interesting topic";
        return `Write a short story ${topicPhrase} in ${sourceLang} suitable for a ${proficiencyLevel} proficiency level learner. The vocabulary and grammar should be appropriate for ${proficiencyLevel}. Include a title starting with '## '. Output ONLY the title and the story text. Do not include any introductory or concluding remarks. Do NOT include translations.`;
    } else {
        return `Write a short, interesting story in ${sourceLang} about a robot learning to paint. Include a title starting with '## '. Output ONLY the title and the story text. Do not include any introductory or concluding remarks. Do NOT include translations.`;
    }
};
