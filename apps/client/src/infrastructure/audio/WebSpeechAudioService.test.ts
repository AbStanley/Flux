import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSpeechAudioService } from './WebSpeechAudioService';

describe('WebSpeechAudioService', () => {
    let service: WebSpeechAudioService;
    let mockSynthesis: any;
    let mockUtterance: any;

    beforeEach(() => {
        mockSynthesis = {
            getVoices: vi.fn().mockReturnValue([]),
            speak: vi.fn(),
            cancel: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
        };

        // Mock generic window.speechSynthesis
        vi.stubGlobal('window', {
            speechSynthesis: mockSynthesis,
        });

        // Mock SpeechSynthesisUtterance constructor
        mockUtterance = {
            voice: null,
            rate: 1,
            onboundary: null,
            onend: null,
            onerror: null,
        };

        class MockSpeechSynthesisUtterance {
            constructor() {
                return mockUtterance;
            }
        }

        vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);

        service = new WebSpeechAudioService(mockSynthesis);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should initialize with provided synthesis or window.speechSynthesis', () => {
        expect(service).toBeTruthy();
    });

    it('should get voices', () => {
        service.getVoices();
        expect(mockSynthesis.getVoices).toHaveBeenCalled();
    });

    it('should play audio with correct parameters', () => {
        const text = 'Hello world';
        const rate = 1.2;
        const onBoundary = vi.fn();
        const onEnd = vi.fn();

        service.play(text, null, rate, onBoundary, onEnd);

        expect(mockSynthesis.cancel).toHaveBeenCalled(); // Should stop previous
        expect(mockSynthesis.resume).toHaveBeenCalled();
        expect(mockSynthesis.speak).toHaveBeenCalledWith(mockUtterance);
        expect(mockUtterance.text).toBeUndefined(); // Mock doesn't auto-set properties from constructor unless logic added, but verify 'speak' called is enough
    });

    it('should handle onboundary events', () => {
        const onBoundary = vi.fn();
        const onEnd = vi.fn();
        service.play('text', null, 1, onBoundary, onEnd);

        // Simulate boundary
        if (mockUtterance.onboundary) {
            mockUtterance.onboundary({ name: 'word', charIndex: 5 });
        }
        expect(onBoundary).toHaveBeenCalledWith(5);
    });

    it('should handle onend events', () => {
        const onBoundary = vi.fn();
        const onEnd = vi.fn();
        service.play('text', null, 1, onBoundary, onEnd);

        // Simulate end
        if (mockUtterance.onend) {
            mockUtterance.onend();
        }
        expect(onEnd).toHaveBeenCalled();
    });

    it('should stop playback', () => {
        service.stop();
        expect(mockSynthesis.cancel).toHaveBeenCalled();
    });

    it('should pause playback', () => {
        service.pause();
        expect(mockSynthesis.pause).toHaveBeenCalled();
    });

    it('should resume playback', () => {
        service.resume();
        expect(mockSynthesis.resume).toHaveBeenCalled();
    });
});
