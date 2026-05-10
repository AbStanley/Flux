export const normalizeApiBaseUrl = (raw?: string): string => {
    if (!raw) {
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            return `http://${window.location.hostname}:3000`;
        }
        return '';
    }

    const url = raw.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    
    // If it's just localhost or 127.0.0.1 without a port, add :3000
    if (url === 'http://localhost' || url === 'http://127.0.0.1') {
        return `${url}:3000`;
    }
    
    return url;
};

export const getApiBaseUrl = (): string => {
    // Docker Build Flag
    if (import.meta.env.VITE_IS_WEB_APP === 'true') {
        const url = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
        return url;
    }

    // Chrome Extension Check
    const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime?.id;
    const isExtensionPopup = typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:';

    if (isExtension || isExtensionPopup) {
        // Fallback to http://localhost:3000 if env var is missing OR empty
        const envUrl = import.meta.env.VITE_EXT_API_URL;
        const url = envUrl || 'http://localhost:3000';

        return normalizeApiBaseUrl(url);
    }

    const fallback = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
    return fallback;
};
