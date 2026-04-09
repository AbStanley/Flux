export interface SubtitleCue {
    start: number; // seconds
    end: number;   // seconds
    text: string;
}

export interface SubtitleTrack {
    id: string;
    label: string;
    cues: SubtitleCue[];
    color: string;
    visible: boolean;
    offsetMs: number;
    source: SubtitleSource;
}

export type SubtitleSource =
    | { type: 'file'; fileName: string }
    | { type: 'url'; url: string };

export interface DetectedVideo {
    element: HTMLVideoElement;
    id: string;
    label: string;
    rect: DOMRect;
}

export interface ActiveTrackCue {
    track: SubtitleTrack;
    cue: SubtitleCue | null;
}
