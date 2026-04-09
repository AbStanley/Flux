import type { SubtitleCue } from '../types/subtitles';

function parseTimestamp(raw: string): number {
    // Handles both SRT (00:01:23,456) and VTT (00:01:23.456) formats
    // Also handles short form (01:23.456)
    const normalized = raw.trim().replace(',', '.');
    const parts = normalized.split(':');
    if (parts.length === 3) {
        return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    }
    if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return 0;
}

function stripTags(text: string): string {
    return text
        .replace(/<[^>]+>/g, '')       // HTML tags
        .replace(/\{[^}]*\}/g, '')     // ASS-style overrides {\\an8}
        .trim();
}

/** Filter out metadata/junk cues that aren't real subtitles */
function isJunkCue(text: string): boolean {
    const lower = text.toLowerCase();
    // Codec/encoding info
    if (/x26[45]|hevc|aac|flac|mkv|mp4|avi|srt|sub/i.test(text) && text.length < 80) return true;
    // Common torrent/release tags
    if (/\b(yts|rarbg|ettv|eztv|mtb|bluray|webrip|brrip|hdtv|dvdrip|1080p|720p|480p)\b/i.test(text)) return true;
    // Subtitle credit lines
    if (lower.includes('subtitles by') || lower.includes('captioned by') || lower.includes('synced by')) return true;
    if (lower.includes('opensubtitles') || lower.includes('subscene') || lower.includes('addic7ed')) return true;
    return false;
}

export function parseSRT(text: string): SubtitleCue[] {
    const cues: SubtitleCue[] = [];
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalized.split(/\n\n+/).filter(Boolean);

    for (const block of blocks) {
        const lines = block.split('\n').filter(Boolean);
        // Find the timestamp line (contains -->)
        const tsIndex = lines.findIndex(l => l.includes('-->'));
        if (tsIndex === -1) continue;

        const [startRaw, endRaw] = lines[tsIndex].split('-->');
        if (!startRaw || !endRaw) continue;

        const start = parseTimestamp(startRaw);
        const end = parseTimestamp(endRaw);
        const text = stripTags(lines.slice(tsIndex + 1).join('\n'));

        if (text && end > start && !isJunkCue(text)) {
            cues.push({ start, end, text });
        }
    }

    return cues;
}

export function parseVTT(text: string): SubtitleCue[] {
    // Strip the WEBVTT header and any metadata blocks
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const headerEnd = normalized.indexOf('\n\n');
    const body = headerEnd !== -1 ? normalized.slice(headerEnd + 2) : normalized;
    return parseSRT(body); // VTT and SRT share the same cue format after the header
}

export function detectFormat(text: string): 'vtt' | 'srt' | 'unknown' {
    const trimmed = text.trim();
    if (trimmed.startsWith('WEBVTT')) return 'vtt';
    // SRT starts with a number (cue index)
    if (/^\d+\s*\n/.test(trimmed)) return 'srt';
    // Check if it has --> timestamps
    if (trimmed.includes('-->')) return 'srt';
    return 'unknown';
}

export function parseSubtitleFile(text: string): SubtitleCue[] {
    const format = detectFormat(text);
    if (format === 'vtt') return parseVTT(text);
    return parseSRT(text); // works for both SRT and unknown (best effort)
}

export function labelFromFileName(fileName: string): string {
    // "movie.en.srt" -> "en", "spanish.srt" -> "spanish"
    const base = fileName.replace(/\.(srt|vtt|sub|ass)$/i, '');
    const parts = base.split('.');
    return parts[parts.length - 1] || base;
}
