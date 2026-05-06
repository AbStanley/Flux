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
    requestId?: string;
}

const activeRequests = new Map<string, AbortController>();

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
    try {
        if (message.type === 'PROXY_REQUEST') {
            const config = message.data as ProxyConfig;
            const requestId = config.requestId;
            
            let controller: AbortController | undefined;
            if (requestId) {
                controller = new AbortController();
                activeRequests.set(requestId, controller);
            }

            handleProxyRequest(config, controller?.signal)
                .then(data => {
                    console.log(`[Background] Proxy SUCCESS for ${config.url}`);
                    sendResponse({ success: true, data });
                })
                .catch((error: unknown) => {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error(`[Background] Proxy FAILURE for ${config.url}:`, errorMessage);
                    sendResponse({ success: false, error: errorMessage });
                })
                .finally(() => {
                    if (requestId) activeRequests.delete(requestId);
                });

            return true; // Will respond asynchronously
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Background] Message listener CRASH:', msg);
        sendResponse({ success: false, error: `Background crash: ${msg}` });
        return false;
    }

    if (message.type === 'CANCEL_REQUEST') {
        const { requestId } = message.data as { requestId: string };
        const controller = activeRequests.get(requestId);
        if (controller) {
            console.log(`[Background] Cancelling request: ${requestId}`);
            controller.abort();
            activeRequests.delete(requestId);
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'Request not found' });
        }
        return true;
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

async function handleProxyRequest(config: ProxyConfig, signal?: AbortSignal): Promise<unknown> {
    const { url, method = 'GET', headers = {}, body } = config;

    console.log('[Background] Fetching:', url);

    try {
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), 60000);
        
        if (signal) {
            signal.addEventListener('abort', () => timeoutController.abort());
        }

        const bodyStr = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined;
        console.log(`[Background] Prepared fetch to ${url} with body length: ${bodyStr?.length || 0}`);

        const fetchOptions: RequestInit = {
            method,
            headers,
            body: bodyStr,
            credentials: 'include',
            signal: timeoutController.signal
        };

        console.log(`[Background] Fetching ${url}...`);
        const startTime = Date.now();
        const response = await fetch(url, fetchOptions);
        const duration = Date.now() - startTime;
        clearTimeout(timeoutId);
        
        console.log(`[Background] Response received in ${duration}ms:`, response.status, response.statusText);
        
        const text = await response.text();
        console.log(`[Background] Body received (${text.length} chars)`);

        if (!response.ok) {
            console.error(`[Background] Response error body: ${text}`);
            if (response.status === 401) {
                throw new Error('Login required. Please sign in via the extension popup.');
            }
            throw new Error(`HTTP error! status: ${response.status} - ${text || response.statusText}`);
        }

        // text was already awaited above at line 156
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
