/**
 * Background Service Worker
 * 
 * This is the central hub for the Extension side of the architecture.
 * 
 * Role:
 * - Cross-Origin Proxy: Proxies requests from Content Script -> Ollama to bypass CORS/PNA.
 * - Context Menu Manager: Handles the "Analyze with Flux" right-click action.
 * - Coordinator: Opens the Side Panel in response to user actions from the In-Page UI.
 */

interface ChromeMessage {
    type: string;
    data?: unknown;
}

interface ChromeResponse {
    success: boolean;
    data?: unknown;
    error?: string;
}

interface ProxyConfig {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "open_flux_panel",
        title: "Analyze with Flux",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "open_flux_panel" && tab?.windowId) {
        // Open the side panel
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});

chrome.runtime.onMessage.addListener((message: ChromeMessage, sender: chrome.runtime.MessageSender, sendResponse: (response: ChromeResponse) => void) => {
    if (message.type === 'PROXY_REQUEST') {
        console.log('[Background] Received PROXY_REQUEST:', message.data);
        handleProxyRequest(message.data as ProxyConfig)
            .then(data => {
                console.log('[Background] Proxy success:', data);
                sendResponse({ success: true, data });
            })
            .catch((error: unknown) => {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error('[Background] Proxy error:', errorMessage);
                sendResponse({ success: false, error: errorMessage });
            });
        return true; // Will respond asynchronously
    }

    if (message.type === 'OPEN_SIDE_PANEL') {
        if (sender.tab?.windowId) {
            chrome.sidePanel.open({ windowId: sender.tab.windowId })
                .then(() => sendResponse({ success: true }))
                .catch((error: unknown) => {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    sendResponse({ success: false, error: errorMessage });
                });
            return true;
        }
    }
});

chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
    if (port.name === 'PROXY_STREAM_CONNECTION') {
        port.onMessage.addListener((message: ChromeMessage) => {
            if (message.type === 'START_STREAM') {
                handleStreamRequest(message.data as ProxyConfig, port);
            }
        });
    }
});

async function handleProxyRequest(config: ProxyConfig): Promise<unknown> {
    const { url, method = 'GET', headers = {}, body } = config;

    console.log('[Background] Fetching:', url);

    try {
        const fetchOptions: RequestInit = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'include'
        };

        const response = await fetch(url, fetchOptions);
        console.log('[Background] Response status:', response.status);
        console.log('[Background] Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        console.log('[Background] Response text length:', text.length);

        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    } catch (error) {
        console.error('[Background] Fetch error:', error);
        throw error;
    }
}

async function handleStreamRequest(config: ProxyConfig, port: chrome.runtime.Port): Promise<void> {
    const { url, method = 'POST', headers = {}, body } = config;

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const errorText = await response.text();
            port.postMessage({ type: 'ERROR', error: `Ollama Error (${response.status}): ${errorText || response.statusText}` });
            port.disconnect();
            return;
        }

        if (!response.body) {
            port.postMessage({ type: 'ERROR', error: 'No response body' });
            port.disconnect();
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                port.postMessage({ type: 'DONE' });
                break;
            }
            const chunk = decoder.decode(value, { stream: true });
            port.postMessage({ type: 'CHUNK', chunk });
        }

        port.disconnect();

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        port.postMessage({ type: 'ERROR', error: errorMessage });
        port.disconnect();
    }
}
