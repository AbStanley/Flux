export interface SubtitleCue {
    start: number;
    duration: number;
    text: string;
}

interface YouTubeCaptionTrack {
    baseUrl: string;
    languageCode: string;
}

interface YouTubePlayerResponse {
    captions?: {
        playerCaptionsTracklistRenderer?: {
            captionTracks?: YouTubeCaptionTrack[];
        };
    };
}

interface ProxyResponse {
    success: boolean;
    data?: unknown;
    error?: string;
}

interface JsonSubtitleEvent {
    tStartMs: number;
    dDurationMs?: number;
    segs?: { utf8: string }[];
}

interface JsonSubtitleData {
    events?: JsonSubtitleEvent[];
}

export class YouTubeService {
    static isYouTubeWatchPage(): boolean {
        return window.location.hostname.includes('youtube.com') && window.location.pathname === '/watch';
    }

    static getVideoId(): string | null {
        const params = new URLSearchParams(window.location.search);
        return params.get('v');
    }

    static async getSubtitles(): Promise<SubtitleCue[]> {
        try {
            const videoId = this.getVideoId();
            if (!videoId) return [];

            // Look for the initial player response in the page source
            const scripts = Array.from(document.getElementsByTagName('script'));
            let playerResponse: YouTubePlayerResponse | null = null;

            for (const script of scripts) {
                const text = script.textContent || '';
                if (text.includes('ytInitialPlayerResponse')) {
                    const match = text.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
                    if (match) {
                        try {
                            playerResponse = JSON.parse(match[1]) as YouTubePlayerResponse;
                            break;
                        } catch {
                            // Ignore parse errors and keep looking
                        }
                    }
                }
            }

            if (!playerResponse) {
                // Fallback: try to fetch the page and parse it (slower)
                const response = await fetch(window.location.href);
                const html = await response.text();
                const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
                if (match) {
                    playerResponse = JSON.parse(match[1]) as YouTubePlayerResponse;
                }
            }

            const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            if (!tracks || tracks.length === 0) {
                return [];
            }

            // Prefer English, then fallback to the first track
            const track = tracks.find(t => t.languageCode === 'en') || tracks[0];
            const jsonUrl = track.baseUrl + (track.baseUrl.includes('?') ? '&' : '?') + 'fmt=json3';

            try {
                // Request subtitles through the background proxy
                const result = await new Promise<unknown>((resolve, reject) => {
                    chrome.runtime.sendMessage({
                        type: 'PROXY_REQUEST',
                        data: { url: jsonUrl }
                    }, (response: ProxyResponse) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else if (!response.success) {
                            reject(new Error(response.error || 'Proxy request failed'));
                        } else {
                            resolve(response.data);
                        }
                    });
                });

                if (!result || (typeof result === 'string' && result.length === 0)) {
                    return await this.fetchXmlSubtitles(track.baseUrl);
                }

                let data: JsonSubtitleData;
                if (typeof result === 'string') {
                    try {
                        data = JSON.parse(result) as JsonSubtitleData;
                    } catch {
                        return await this.fetchXmlSubtitles(track.baseUrl);
                    }
                } else {
                    data = result as JsonSubtitleData;
                }

                const cues = this.parseJsonSubtitles(data);
                return cues;

            } catch {
                return await this.fetchXmlSubtitles(track.baseUrl);
            }
        } catch {
            return [];
        }
    }

    private static async fetchXmlSubtitles(url: string): Promise<SubtitleCue[]> {
        try {
            const result = await new Promise<unknown>((resolve, reject) => {
                chrome.runtime.sendMessage({
                    type: 'PROXY_REQUEST',
                    data: { url }
                }, (response: ProxyResponse) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (!response.success) {
                        reject(new Error(response.error || 'Proxy request failed'));
                    } else {
                        resolve(response.data);
                    }
                });
            });

            const xmlText = typeof result === 'string' ? result : JSON.stringify(result);

            if (xmlText.length === 0) return [];

            const cues = this.parseXmlSubtitles(xmlText);
            return cues;
        } catch {
            return [];
        }
    }

    private static parseXmlSubtitles(xmlText: string): SubtitleCue[] {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const texts = Array.from(doc.getElementsByTagName('text'));

        return texts.map(text => ({
            start: parseFloat(text.getAttribute('start') || '0'),
            duration: parseFloat(text.getAttribute('dur') || '0'),
            text: this.stripHtml(text.textContent || '')
        }));
    }

    private static stripHtml(html: string): string {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    }

    private static parseJsonSubtitles(data: JsonSubtitleData): SubtitleCue[] {
        if (!data?.events) return [];

        return data.events
            .filter((event) => event.segs && event.segs.length > 0)
            .map((event) => ({
                start: event.tStartMs / 1000,
                duration: (event.dDurationMs || 0) / 1000,
                text: event.segs!.map((seg) => seg.utf8).join('').trim()
            }))
            .filter((cue) => cue.text.length > 0);
    }


    static getSubtitleFromDom(): SubtitleCue | null {
        try {
            const segments = document.querySelectorAll('.ytp-caption-segment');
            if (segments.length === 0) return null;

            const text = Array.from(segments)
                .map(s => s.textContent || '')
                .join(' ')
                .trim();

            if (!text) return null;

            return {
                start: 0,
                duration: 0,
                text
            };
        } catch {
            return null;
        }
    }

    static getVideoElement(): HTMLVideoElement | null {
        return document.querySelector('video.html5-main-video');
    }
}
