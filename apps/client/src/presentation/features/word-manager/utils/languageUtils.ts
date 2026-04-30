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

export const getLanguageAbbreviation = (name?: string): string => {
    if (!name) return '??';
    const codes: Record<string, string> = {
        'spanish': 'ESP',
        'english': 'ENG',
        'french': 'FRA',
        'german': 'GER',
        'italian': 'ITA',
        'portuguese': 'POR',
        'russian': 'RUS',
        'japanese': 'JPN',
        'chinese': 'CHN',
        'chinese (simplified)': 'CHN',
        'chinese (traditional)': 'TWN',
        'dutch': 'NLD',
        'polish': 'POL',
        'turkish': 'TUR',
        'arabic': 'ARA',
        'hindi': 'HIN',
        'swedish': 'SWE',
        'danish': 'DNK',
        'norwegian': 'NOR',
        'finnish': 'FIN',
        'greek': 'GRC',
        'hebrew': 'HEB',
        'thai': 'THA',
        'vietnamese': 'VNM',
        'indonesian': 'IDN',
    };
    return codes[name.toLowerCase().trim()] || name.slice(0, 3).toUpperCase();
};

export const getLanguageFlag = (name?: string): string => {
    if (!name) return '🏳️';
    const flags: Record<string, string> = {
        'spanish': '🇪🇸',
        'english': '🇺🇸',
        'french': '🇫🇷',
        'german': '🇩🇪',
        'italian': '🇮🇹',
        'portuguese': '🇵🇹',
        'russian': '🇷🇺',
        'japanese': '🇯🇵',
        'chinese': '🇨🇳',
        'chinese (simplified)': '🇨🇳',
        'chinese (traditional)': '🇹🇼',
        'dutch': '🇳🇱',
        'polish': '🇵🇱',
        'turkish': '🇹🇷',
        'arabic': '🇸🇦',
        'hindi': '🇮🇳',
        'swedish': '🇸🇪',
        'danish': '🇩🇰',
        'norwegian': '🇳🇴',
        'finnish': '🇫🇮',
        'greek': '🇬🇷',
        'hebrew': '🇮🇱',
        'thai': '🇹🇭',
        'vietnamese': '🇻🇳',
        'indonesian': '🇮🇩',
    };
    return flags[name.toLowerCase().trim()] || '🌐';
};
