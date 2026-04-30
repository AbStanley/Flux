import { getApiBaseUrl } from "./base-url";
import { getStoredApiUrl } from "../settings/settings.store";

export async function getAuthToken(): Promise<string | null> {
  // In extension context, read from chrome.storage.local
  const isExtension =
    typeof window !== "undefined" &&
    window.location.protocol === "chrome-extension:";
  if (isExtension && chrome?.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get(["flux_auth_token"], (result) => {
        const data = result as { flux_auth_token?: string };
        resolve(data.flux_auth_token || null);
      });
    });
  }
  // Web app: read from localStorage
  return localStorage.getItem("flux_auth_token");
}

export class ApiClient {
  private baseUrl: string;
  private onUnauthorized?: () => void;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async getActiveBaseUrl(): Promise<string> {
    const storedUrl = await getStoredApiUrl();
    return storedUrl || this.baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  public setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    signal?: AbortSignal,
  ): Promise<T> {
    const activeBaseUrl = await this.getActiveBaseUrl();
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${activeBaseUrl}${endpoint}`;

    console.log(`[Flux Network Probe] Requesting: ${url}`);

    const method = options.method || "GET";
    const body = options.body;

    // Inject JWT token from storage
    const token = await getAuthToken();
    console.log(`[Flux Network Probe] Token present: ${!!token}`);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    // Check for extension context to avoid CORS issues and reach localhost from browser
    const isExtension = typeof window !== "undefined" && window.location.protocol === "chrome-extension:";
    if (isExtension && chrome?.runtime?.id) {
      console.log(`[Flux Debug] ApiClient: Proxying ${method} ${url}`);
      return new Promise<T>((resolve, reject) => {
        let parsedBody: unknown = undefined;
        if (body && typeof body === "string") {
          try {
            parsedBody = JSON.parse(body);
          } catch (e) {
            console.warn(
              "[Flux Debug] ApiClient: Failed to parse body as JSON",
              e,
            );
            parsedBody = body;
          }
        }

        chrome.runtime.sendMessage(
          {
            type: "PROXY_REQUEST",
            data: {
              url,
              method,
              headers,
              body: parsedBody,
            },
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                "[Flux Debug] ApiClient: Extension error:",
                chrome.runtime.lastError.message,
              );
              reject(new Error(chrome.runtime.lastError.message));
            } else if (!response) {
              console.error(
                "[Flux Debug] ApiClient: No response from background script",
              );
              reject(new Error("No response from background script"));
            } else if (!response.success) {
              console.error(
                "[Flux Debug] ApiClient: Proxy failure:",
                response.error,
              );
              reject(new Error(response.error || "Proxy request failed"));
            } else {
              console.log(
                "[Flux Debug] ApiClient: Proxy success",
                response.data,
              );
              resolve(response.data as T);
            }
          },
        );
      });
    }

    const config: RequestInit = {
      ...options,
      headers,
      signal,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401 && !url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
        const tokenAtError = await getAuthToken();
        
        if (tokenAtError) {
          // Only clear and logout if we actually thought we had a valid session
          localStorage.removeItem("flux_auth_token");
          if (this.onUnauthorized) {
            this.onUnauthorized();
          }
          throw new Error("Session expired. Please log in again.");
        } else {
          // No token was sent, so just inform the user/app without clearing anything
          throw new Error("Login required. Please sign in first.");
        }
      }
      const text = await response.text();
      let errorMessage = text || response.statusText;
      
      try {
        const parsed = JSON.parse(text);
        if (parsed.message) {
          errorMessage = Array.isArray(parsed.message) 
            ? parsed.message[0] 
            : parsed.message;
        }
      } catch {
        // Not JSON or no message, stick with statusText
      }

      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers?.get?.("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    return response.text() as unknown as T;
  }

  get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const queryStr = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<T>(`${endpoint}${queryStr}`, { method: "GET" });
  }

  post<T>(endpoint: string, data: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      signal,
    );
  }

  patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Singleton instance with default configuration
const defaultBaseUrl = getApiBaseUrl();
export const defaultClient = new ApiClient(defaultBaseUrl);

export const setApiClientBaseUrl = (url: string) => {
  defaultClient.setBaseUrl(url);
};
