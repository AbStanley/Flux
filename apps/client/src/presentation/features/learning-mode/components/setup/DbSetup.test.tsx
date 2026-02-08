import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DbSetup } from './DbSetup';
import { useGameStore } from '../../store/useGameStore';
import { wordsApi } from '@/infrastructure/api/words';
import userEvent from '@testing-library/user-event';

// Mocks
vi.mock('../../store/useGameStore');
vi.mock('@/infrastructure/api/words');

describe('DbSetup', () => {
    const updateConfigSpy = vi.fn();
    const mockStore = {
        config: {
            sourceLang: 'en',
            targetLang: 'es'
        },
        updateConfig: updateConfigSpy
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useGameStore as any).mockReturnValue(mockStore);
        (wordsApi.getLanguages as any).mockResolvedValue([]);
    });

    it('should render language selectors', () => {
        render(<DbSetup />);
        expect(screen.getByText(/Foreign Language/i)).toBeDefined();
        expect(screen.getByText(/Native Language/i)).toBeDefined();
    });

    it('should fetch languages on mount', async () => {
        render(<DbSetup />);
        await waitFor(() => {
            expect(wordsApi.getLanguages).toHaveBeenCalled();
        });
    });

    it('should swap languages when button is clicked', async () => {
        const user = userEvent.setup();
        render(<DbSetup />);

        // "Swap Languages" title is on the button
        const swapBtn = screen.getByTitle('Swap Languages');
        await user.click(swapBtn);

        expect(updateConfigSpy).toHaveBeenCalledWith({
            sourceLang: 'es',
            targetLang: 'en'
        });
    });

    it('should filter available options based on graph', async () => {
        const mockLangs = [
            { sourceLanguage: 'en', targetLanguage: 'es' },
            { sourceLanguage: 'en', targetLanguage: 'fr' },
        ];
        (wordsApi.getLanguages as any).mockResolvedValue(mockLangs);

        render(<DbSetup />);

        await waitFor(() => {
            expect(wordsApi.getLanguages).toHaveBeenCalled();
        });

        // Use findByText to wait for re-render
        expect(await screen.findByText(/English/i)).toBeDefined();
        expect(await screen.findByText(/Spanish/i)).toBeDefined();
    });
});




