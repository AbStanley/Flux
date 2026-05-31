import { YouTubeTranscriptFetcher, type SubtitleCue } from './YouTubeTranscriptFetcher';

export type { SubtitleCue };

export class YouTubeService {
    static isYouTubeWatchPage(): boolean {
        const h = window.location.hostname;
        const p = window.location.pathname;
        return (h.includes('youtube.') || h.endsWith('youtube')) && (p === '/watch' || p === '/watch/');
    }

    static getVideoId(): string | null {
        return new URLSearchParams(window.location.search).get('v');
    }

    static getSubtitleFromDom(): SubtitleCue | null {
        try {
            const player = document.getElementById('movie_player');
            let segments: Element[] = [];

            const isElementVisible = (el: Element): boolean => {
                let current: Node | null = el;
                while (current && current !== player && current !== document.body) {
                    if (current instanceof HTMLElement) {
                        if (current.style && current.style.display === 'none') {
                            return false;
                        }
                    }
                    current = current.parentNode instanceof ShadowRoot 
                        ? current.parentNode.host 
                        : current.parentNode;
                }
                return true;
            };

            if (player) {
                let found = player.querySelectorAll('.ytp-caption-segment');
                if (found.length === 0 && player.shadowRoot) {
                    found = player.shadowRoot.querySelectorAll('.ytp-caption-segment');
                }
                segments = Array.from(found).filter(isElementVisible);
            }

            if (segments.length === 0) {
                const container = document.querySelector('#movie_player .ytp-caption-window-container')
                    || document.querySelector('.ytp-caption-window-container');
                if (container) {
                    const found = container.querySelectorAll('.ytp-caption-segment');
                    segments = Array.from(found).filter(isElementVisible);
                }
            }

            if (segments.length === 0) {
                const found = document.querySelectorAll('.ytp-caption-segment');
                segments = Array.from(found).filter(isElementVisible);
            }

            if (segments.length === 0) return null;

            let text = segments.map(s => s.textContent || '').join(' ').trim();
            text = this.cleanSubtitleText(text);
            return text ? { start: 0, duration: 0, text } : null;
        } catch {
            return null;
        }
    }

    static getVideoElement(): HTMLVideoElement | null {
        return document.querySelector('video.html5-main-video');
    }

    static seekTo(seconds: number): void {
        const video = this.getVideoElement();
        if (video) video.currentTime = seconds;
    }

    static hideNativeSubtitles(): void {
        const styleId = 'flux-hide-yt-subtitles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .ytp-caption-window-container,
            #ytp-caption-window-container,
            .caption-window,
            .ytp-caption-segment {
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
                height: 0 !important;
                overflow: hidden !important;
            }
        `;
        document.head.appendChild(style);
    }

    static showNativeSubtitles(): void {
        document.getElementById('flux-hide-yt-subtitles')?.remove();
    }

    static isNativeSubtitlesActive(): boolean {
        return document.querySelector('.ytp-subtitles-button')?.getAttribute('aria-pressed') === 'true';
    }

    static cleanSubtitleText(text: string): string {
        return YouTubeTranscriptFetcher.cleanSubtitleText(text);
    }

    static async fetchTranscript(videoId: string, preferredLang: string = 'Auto'): Promise<SubtitleCue[]> {
        return YouTubeTranscriptFetcher.fetchTranscript(videoId, preferredLang);
    }
}
