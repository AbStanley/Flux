import { ALL_LANGUAGES } from '@/core/constants/languages';

export const COMMON_LANGUAGES = ALL_LANGUAGES;

export const getFlagUrl = (countryCode: string) => {
    return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
};
