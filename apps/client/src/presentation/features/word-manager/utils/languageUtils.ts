export const getLanguageCode = (languageName?: string): string => {
    if (!languageName) return 'en-US';

    const lowerName = languageName.toLowerCase().trim();

    const languageMap: Record<string, string> = {
        'english': 'en-US',
        'spanish': 'es-ES',
        'french': 'fr-FR',
        'german': 'de-DE',
        'italian': 'it-IT',
        'portuguese': 'pt-PT',
        'russian': 'ru-RU',
        'japanese': 'ja-JP',
        'korean': 'ko-KR',
        'chinese': 'zh-CN',
        'chinese (simplified)': 'zh-CN',
        'chinese (traditional)': 'zh-TW',
        'dutch': 'nl-NL',
        'polish': 'pl-PL',
        'turkish': 'tr-TR',
        'arabic': 'ar-SA',
        'hindi': 'hi-IN',
        'swedish': 'sv-SE',
        'danish': 'da-DK',
        'norwegian': 'no-NO',
        'finnish': 'fi-FI',
        'greek': 'el-GR',
        'hebrew': 'he-IL',
        'thai': 'th-TH',
        'vietnamese': 'vi-VN',
        'indonesian': 'id-ID',
    };

    // If it's already a code (approximate check), return it as is
    if (/^[a-z]{2,3}(-[A-Z]{2,3})?$/.test(languageName)) {
        return languageName;
    }

    return languageMap[lowerName] || 'en-US';
};
