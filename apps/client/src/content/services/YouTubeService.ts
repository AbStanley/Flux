export interface SubtitleCue {
    start: number;
    duration: number;
    text: string;
}

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
            let segments = document.querySelectorAll('.ytp-caption-segment');
            if (segments.length === 0) {
                const player = document.getElementById('movie_player');
                if (player?.shadowRoot) {
                    segments = player.shadowRoot.querySelectorAll('.ytp-caption-segment');
                }
            }
            if (segments.length === 0) {
                const container = document.querySelector('.ytp-caption-window-container');
                if (container) segments = container.querySelectorAll('.ytp-caption-segment');
            }
            if (segments.length === 0) return null;

            let text = Array.from(segments).map(s => s.textContent || '').join(' ').trim();
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
        return text.replace(/([a-zA-Z-áéíóúÁÉÍÓÚñÑ]+\s*)?\((auto-generated|generado automáticamente)\)/gi, '')
                   .replace(/click[\s\S]*?for[\s\S]*?settings/gi, '')
                   .replace(/haz\s*clic\s*para\s*ver\s*las\s*opciones/gi, '')
                   .replace(/\[.*?\]/g, '')
                   .replace(/\(.*?\)/g, '')
                   .trim();
    }

    static async fetchTranscript(videoId: string): Promise<SubtitleCue[]> {
        try {
            const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
            const html = await response.text();
            
            const startStr = 'ytInitialPlayerResponse = ';
            const startIdx = html.indexOf(startStr);
            if (startIdx === -1) return [];
            const start = html.indexOf('{', startIdx);
            if (start === -1) return [];
            
            let braceCount = 0;
            let endIdx = -1;
            for (let i = start; i < html.length; i++) {
                if (html[i] === '{') braceCount++;
                else if (html[i] === '}') braceCount--;
                if (braceCount === 0) {
                    endIdx = i;
                    break;
                }
            }
            if (endIdx === -1) return [];
            
            const jsonStr = html.substring(start, endIdx + 1);
            const playerResponse = JSON.parse(jsonStr);
            const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            if (!captionTracks || captionTracks.length === 0) return [];
            
            let track = captionTracks.find((t: { languageCode: string; vssId?: string }) => t.languageCode === 'en' && t.vssId !== 'a.en');
            if (!track) track = captionTracks.find((t: { languageCode: string }) => t.languageCode === 'en');
            if (!track) track = captionTracks[0];
            if (!track || !track.baseUrl) return [];
            
            const trackResponse = await fetch(track.baseUrl);
            const xmlText = await trackResponse.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            const textNodes = xmlDoc.getElementsByTagName('text');
            const cues: SubtitleCue[] = [];
            
            for (let i = 0; i < textNodes.length; i++) {
                const node = textNodes[i];
                const startAttr = parseFloat(node.getAttribute('start') || '0');
                const durAttr = parseFloat(node.getAttribute('dur') || '0');
                const text = node.textContent || '';
                const cleanText = this.cleanSubtitleText(text);
                                     
                if (cleanText) {
                    const lastCue = cues.length > 0 ? cues[cues.length - 1] : null;
                    if (lastCue) {
                        const gap = startAttr - (lastCue.start + lastCue.duration);
                        const isPunctuation = /[.!?]$/.test(lastCue.text.trim());
                        const isDuplicate = Math.abs(lastCue.start - startAttr) < 0.1;
                        const shouldMerge = (gap >= 0 && gap < 1.0 && !isPunctuation && lastCue.text.length < 100);
                        const normLast = lastCue.text.replace(/[.,!?¿¡\n]/g, '').toLowerCase().trim();
                        const normClean = cleanText.replace(/[.,!?¿¡\n]/g, '').toLowerCase().trim();
                        
                        if (normClean.startsWith(normLast) && normClean.length >= normLast.length) {
                            lastCue.text = cleanText;
                            lastCue.duration = Math.max(lastCue.duration, (startAttr + durAttr) - lastCue.start);
                            continue;
                        }
                        if (isDuplicate) {
                            if (!lastCue.text.toLowerCase().includes(cleanText.toLowerCase())) {
                                lastCue.text += (cleanText.startsWith('\n') ? '' : '\n') + cleanText;
                            }
                            lastCue.duration = Math.max(lastCue.duration, (startAttr + durAttr) - lastCue.start);
                            continue;
                        }
                        if (shouldMerge) {
                            const lastWord = lastCue.text.split(' ').pop() || '';
                            const firstWord = cleanText.split(' ')[0] || '';
                            if (lastWord.toLowerCase() === firstWord.toLowerCase()) {
                                lastCue.text += ' ' + cleanText.substring(firstWord.length).trim();
                            } else {
                                lastCue.text += (cleanText.startsWith('\n') ? '' : ' ') + cleanText;
                            }
                            lastCue.duration = Math.max(lastCue.duration, (startAttr + durAttr) - lastCue.start);
                            continue;
                        }
                    }
                    cues.push({ start: startAttr, duration: durAttr, text: cleanText });
                }
            }
            return cues;
        } catch (error) {
            console.error('Failed to fetch YouTube transcript:', error);
            return [];
        }
    }
}
