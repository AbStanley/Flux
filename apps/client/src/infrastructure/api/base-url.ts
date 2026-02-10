export const normalizeApiBaseUrl = (raw?: string): string => {
    if (!raw) return '';
    return raw.replace(/\/api\/?$/, '');
};

export const getApiBaseUrl = (): string => {
    // Docker Build Flag: Forces relative paths for the Web App, ignoring any runtime environment confusion.
    if (import.meta.env.VITE_IS_WEB_APP === 'true') {
        return normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
    }

    // If running in a Chrome Extension context (background or popup/sidepanel)
    // We check the protocol, which is the most robust way to distinguish extension views from web pages.
    if (typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:') {
        return 'http://localhost:3000';
    }
    // Fallback: Content Scripts run on http/https pages but have access to chrome.runtime.
    // This check catches them. Standard web pages do not have chrome.runtime.id.
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
        return 'http://localhost:3000';
    }

    return normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
};
