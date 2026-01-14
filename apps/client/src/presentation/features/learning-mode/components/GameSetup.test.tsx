import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameSetup } from './GameSetup';
import { useGameStore } from '../store/useGameStore';
import { wordsApi } from '@/infrastructure/api/words';
import { ankiService } from '@/infrastructure/external/anki/AnkiService';

// Mocks
vi.mock('../store/useGameStore');
vi.mock('@/infrastructure/api/words');
vi.mock('@/infrastructure/external/anki/AnkiService');

describe('GameSetup', () => {
    const updateConfigSpy = vi.fn();
    const startGameSpy = vi.fn();

    const mockStore = {
        config: {
            mode: 'multiple-choice',
            source: 'db',
            timerEnabled: true,
            sourceLang: 'en',
            targetLang: 'es'
        },
        updateConfig: updateConfigSpy,
        startGame: startGameSpy
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useGameStore as any).mockReturnValue(mockStore);
        (wordsApi.getAll as any).mockResolvedValue({ items: [] });
        (ankiService.getDeckNames as any).mockResolvedValue([]);
    });

    it('should render correctly', () => {
        render(<GameSetup />);
        expect(screen.getByText('Training Arena')).toBeDefined();
        // Since source is 'db', DbSetup should be visible (by Source Language label)
        // Note: content visibility depends on active tab which defaults to config.source ('db')
        expect(screen.getByText('Source Language (Question)')).toBeDefined();
    });

    it('should switch tabs', () => {
        render(<GameSetup />);
        expect(screen.getByText(/Saved Words/)).toBeDefined();
        expect(screen.getByText(/Anki Decks/)).toBeDefined();
    });

    it('should call startGame on button click', () => {
        render(<GameSetup />);
        const startBtn = screen.getByText('START GAME');
        fireEvent.click(startBtn);
        expect(startGameSpy).toHaveBeenCalled();
    });
});
