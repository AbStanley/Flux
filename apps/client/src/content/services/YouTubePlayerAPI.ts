/**
 * YouTube Player API wrappers.
 *
 * MV3 content scripts cannot inject inline scripts into strict CSP pages like YouTube.
 * Because of this, we strictly use raw HTMLVideoElement properties here instead of
 * attempting to bridge into the page-context movie_player API.
 */

export function seekViaPlayer(seconds: number): void {
    const video = document.querySelector('video.html5-main-video') as HTMLVideoElement | null;
    if (video) video.currentTime = seconds;
}

export function pauseViaPlayer(): void {
    const video = document.querySelector('video.html5-main-video') as HTMLVideoElement | null;
    if (video) video.pause();
}

export function playViaPlayer(): void {
    const video = document.querySelector('video.html5-main-video') as HTMLVideoElement | null;
    if (video) video.play();
}

/**
 * Gets current time. Falls back to video.currentTime since the
 * async round-trip via CustomEvent isn't practical for sync reads.
 */
export function getCurrentTime(): number {
    const video = document.querySelector('video.html5-main-video') as HTMLVideoElement | null;
    return video?.currentTime ?? 0;
}

export function isPlaying(): boolean {
    const video = document.querySelector('video.html5-main-video') as HTMLVideoElement | null;
    return video ? !video.paused : false;
}

// Legacy helpers used by other modules

export function findCCButton(): HTMLElement | null {
    return document.querySelector('.ytp-subtitles-button');
}

export function readCCPressed(): boolean {
    const btn = findCCButton();
    if (!btn) return true; // Default on when button not found
    const val = btn.getAttribute('aria-pressed');
    return val === null || val === 'true';
}
