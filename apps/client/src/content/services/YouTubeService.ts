export interface SubtitleCue {
    start: number;
    duration: number;
    text: string;
}



export class YouTubeService {
    static isYouTubeWatchPage(): boolean {
        return window.location.hostname.includes('youtube.com') && window.location.pathname === '/watch';
    }

    static getVideoId(): string | null {
        const params = new URLSearchParams(window.location.search);
        return params.get('v');
    }




    static getSubtitleFromDom(): SubtitleCue | null {
        try {
            const segments = document.querySelectorAll('.ytp-caption-segment');
            if (segments.length === 0) return null;

            let text = Array.from(segments)
                .map(s => s.textContent || '')
                .join(' ')
                .trim();

            // Clean up YouTube auto-generated garbage text
            text = text.replace(/([a-zA-Z-áéíóúÁÉÍÓÚñÑ]+\s*)?\((auto-generated|generado automáticamente)\)/gi, '')
                       .replace(/click[\s\S]*?for[\s\S]*?settings/gi, '')
                       .replace(/haz\s*clic\s*para\s*ver\s*las\s*opciones/gi, '')
                       .replace(/\[.*?\]/g, '') // Strip [Music], [Applause], etc.
                       .replace(/\(.*?\)/g, '') // Strip (laughter), etc.
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

    static seekTo(seconds: number): void {
        const video = this.getVideoElement();
        if (video) {
            video.currentTime = seconds;
        }
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
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    static showNativeSubtitles(): void {
        const style = document.getElementById('flux-hide-yt-subtitles');
        if (style) {
            style.remove();
        }
    }

    static isNativeSubtitlesActive(): boolean {
        const subButton = document.querySelector('.ytp-subtitles-button');
        return subButton?.getAttribute('aria-pressed') === 'true';
    }
}
