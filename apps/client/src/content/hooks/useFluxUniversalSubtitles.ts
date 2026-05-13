import { useVideoDetector } from './useVideoDetector';
import { useSubtitleTracks } from './useSubtitleTracks';
import { useVideoSync } from './useVideoSync';

export function useFluxUniversalSubtitles() {
    const videoDetector = useVideoDetector();
    const subtitleTracks = useSubtitleTracks();
    const videoSync = useVideoSync(videoDetector.selectedVideo, subtitleTracks.tracks);

    return {
        videoDetector,
        subtitleTracks,
        videoSync,
        activeCues: videoSync.activeCues,
        currentTime: videoSync.currentTime,
        showUniversalSubs: !!videoDetector.selectedVideo,
    };
}
