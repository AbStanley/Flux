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
}
