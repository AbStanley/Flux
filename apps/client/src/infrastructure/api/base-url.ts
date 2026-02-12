export const normalizeApiBaseUrl = (raw?: string): string => {
    if (!raw) return '';
    return raw.replace(/\/api\/?$/, '');
};

export const getApiBaseUrl = (): string => {
    // Docker Build Flag
    if (import.meta.env.VITE_IS_WEB_APP === 'true') {
        const url = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
        return url;
    }

    // Chrome Extension Check
    const isExtension = (typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:') ||
        (typeof chrome !== 'undefined' && !!chrome.runtime?.id);

    if (isExtension) {
        // Fallback to https://localhost if env var is missing OR empty
        const envUrl = import.meta.env.VITE_EXT_API_URL;
        const url = envUrl || 'http://localhost';

        return url;
    }

    const fallback = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
    return fallback;
};
