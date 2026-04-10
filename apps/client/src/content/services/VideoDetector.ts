import type { DetectedVideo } from '../types/subtitles';

function isYouTube(): boolean {
    return window.location.hostname.includes('youtube.com');
}

function makeLabel(el: HTMLVideoElement, index: number): string {
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label')!;
    if (el.title) return el.title;
    const src = el.currentSrc || el.src || '';
    if (src && !src.startsWith('blob:')) {
        try {
            const url = new URL(src);
            const name = url.pathname.split('/').pop() || '';
            if (name) return decodeURIComponent(name).slice(0, 40);
        } catch { /* ignore */ }
    }
    const rect = el.getBoundingClientRect();
    return `Video ${index + 1} (${Math.round(rect.width)}×${Math.round(rect.height)})`;
}

/** Recursively collect ALL <video> elements, including shadow DOM and iframes */
function collectAllVideos(root: Document | ShadowRoot | Element): HTMLVideoElement[] {
    const videos: HTMLVideoElement[] = [];
    try {
        root.querySelectorAll('video').forEach(v => videos.push(v));
    } catch { /* ignore */ }
    try {
        root.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) videos.push(...collectAllVideos(el.shadowRoot));
        });
    } catch { /* ignore */ }
    return videos;
}

function collectIframeVideos(): HTMLVideoElement[] {
    const videos: HTMLVideoElement[] = [];
    try {
        document.querySelectorAll('iframe').forEach(iframe => {
            try {
                const doc = iframe.contentDocument;
                if (doc) videos.push(...collectAllVideos(doc));
            } catch { /* cross-origin */ }
        });
    } catch { /* ignore */ }
    return videos;
}

/** Find ALL videos on the page — no filtering. Used for manual picker. */
export function findAllVideos(): DetectedVideo[] {
    if (isYouTube()) return [];

    const results: DetectedVideo[] = [];
    const seen = new Set<HTMLVideoElement>();

    // Direct <video> elements
    const allVideos = [...collectAllVideos(document), ...collectIframeVideos()];
    allVideos.forEach((el, i) => {
        if (seen.has(el)) return;
        seen.add(el);
        results.push({ element: el, id: `v${i}`, label: makeLabel(el, i), rect: el.getBoundingClientRect() });
    });

    // Iframes that likely contain video (cross-origin — we can't access the video element,
    // but we can overlay on top of the iframe). Detect by size and common video embed patterns.
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe, i) => {
        // Skip if we already found a video inside this iframe (same-origin case)
        try { if (iframe.contentDocument?.querySelector('video')) return; } catch { /* cross-origin, proceed */ }

        const rect = iframe.getBoundingClientRect();
        if (rect.width < 200 || rect.height < 120) return; // too small to be a video

        const src = iframe.src || '';
        const isVideoEmbed = /player|video|embed|vimeo|dailymotion|twitch|streamable|wistia|cdn/i.test(src)
            || rect.width / rect.height > 1.2; // landscape aspect ratio suggests video

        if (isVideoEmbed || rect.width >= 400) {
            // Create a proxy "video element" — we use the iframe as the positioning target
            // but wrap it in a fake video element interface for the overlay
            const proxy = iframe as unknown as HTMLVideoElement;
            results.push({
                element: proxy,
                id: `iframe-v${i}`,
                label: `Embedded video ${results.length + 1} (${Math.round(rect.width)}×${Math.round(rect.height)})`,
                rect,
            });
        }
    });

    return results;
}

/** Try to re-find a video element that may have been recreated by the player */
export function refindVideo(prev: HTMLVideoElement): HTMLVideoElement | null {
    // Still in DOM?
    if (document.contains(prev)) return prev;

    // Try to find a video with the same src
    const src = prev.currentSrc || prev.src;
    if (src) {
        const all = [...collectAllVideos(document), ...collectIframeVideos()];
        const match = all.find(v => (v.currentSrc || v.src) === src);
        if (match) return match;
    }

    // Fall back to first visible video
    const all = findAllVideos();
    if (all.length === 1) return all[0].element;

    return null;
}
