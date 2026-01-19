import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AnkiSetup } from './AnkiSetup';
import { useGameStore } from '../../store/useGameStore';
import { ankiService } from '@/infrastructure/external/anki/AnkiService';
import userEvent from '@testing-library/user-event';

// Mocks
vi.mock('../../store/useGameStore');
vi.mock('@/infrastructure/external/anki/AnkiService');

describe('AnkiSetup', () => {
    const updateConfigSpy = vi.fn();
    const mockStore = {
        config: {
            ankiDeckName: '',
            ankiFieldSource: '',
            ankiFieldTarget: '',
            sourceLang: 'en',
            targetLang: 'es'
        },
        updateConfig: updateConfigSpy
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useGameStore as any).mockReturnValue(mockStore);
        (ankiService.getDeckNames as any).mockResolvedValue(['Deck 1', 'Deck 2']);
        (ankiService.getDeckNames as any).mockResolvedValue(['Deck 1', 'Deck 2']);
        (ankiService.findNotes as any).mockResolvedValue([123]);
        (ankiService.getNotesInfo as any).mockResolvedValue([{
            fields: { Front: { value: 'q' }, Back: { value: 'a' } }
        }]);
    });

    it('should fetch and display decks on mount', async () => {
        render(<AnkiSetup />);
        await waitFor(() => {
            expect(ankiService.getDeckNames).toHaveBeenCalled();
        });
        expect(screen.queryByText(/Connection Failed/)).toBeNull();
    });

    it('should show error if fetching decks fails', async () => {
        (ankiService.getDeckNames as any).mockRejectedValue(new Error('Fail'));
        render(<AnkiSetup />);

        await waitFor(() => {
            expect(screen.getByText('Connection Failed')).toBeDefined();
        });
        expect(screen.getByText(/Troubleshooting/)).toBeDefined();
    });

    it('should fetch fields when deck is selected', async () => {
        const storeWithDeck = {
            ...mockStore,
            config: { ...mockStore.config, ankiDeckName: 'Deck 1' }
        };
        (useGameStore as any).mockReturnValue(storeWithDeck);

        render(<AnkiSetup />);
        await waitFor(() => {
            expect(ankiService.findNotes).toHaveBeenCalledWith('deck:"Deck 1"');
            expect(ankiService.getNotesInfo).toHaveBeenCalled();
        });

        expect(screen.getByText('Front Field (Question)')).toBeDefined();
    });

    it('should swap configuration', async () => {
        const storeWithDeckAndFields = {
            ...mockStore,
            config: {
                ...mockStore.config,
                ankiDeckName: 'Deck 1',
                ankiFieldSource: 'Front',
                ankiFieldTarget: 'Back'
            }
        };
        (useGameStore as any).mockReturnValue(storeWithDeckAndFields);

        const user = userEvent.setup();
        render(<AnkiSetup />);

        await waitFor(() => {
            expect(screen.getByText('Swap Front/Back')).toBeDefined();
        });

        const swapBtn = screen.getByText('Swap Front/Back');
        await user.click(swapBtn);

        expect(updateConfigSpy).toHaveBeenCalledWith({
            ankiFieldSource: 'Back',
            ankiFieldTarget: 'Front',
            sourceLang: 'es',
            targetLang: 'en'
        });
    });
});
