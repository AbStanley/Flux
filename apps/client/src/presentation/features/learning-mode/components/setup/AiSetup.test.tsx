import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiSetup } from './AiSetup';
import { useGameStore } from '../../store/useGameStore';


// Mock dependencies
vi.mock('../../store/useGameStore', () => ({
    useGameStore: vi.fn(),
}));

vi.mock('@/infrastructure/ai/ServerAIService', () => ({
    serverAIService: {
        getAvailableModels: vi.fn().mockResolvedValue(['llama2']),
    }
}));


// Mock LanguageSelector
vi.mock('./LanguageSelector', () => ({
    LanguageSelector: ({ label, value, onChange }: any) => (
        <div data-testid="lang-select">
            <label>{label}</label>
            <select
                data-testid={`select-${label}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="en">English</option>
                <option value="es">Spanish</option>
            </select>
        </div>
    )
}));

describe('AiSetup', () => {
    const mockUpdateConfig = vi.fn();
    const mockConfig = {
        sourceLang: 'es',
        targetLang: 'en',
        aiHost: '',
        aiModel: '',
        aiTopic: '',
        aiLevel: 'intermediate',
        timerEnabled: false,
        gameMode: 'scramble'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useGameStore as any).mockReturnValue({
            config: mockConfig,
            updateConfig: mockUpdateConfig
        });
    });

    it('should render language selectors', () => {
        render(<AiSetup />);
        expect(screen.getByText(/Foreign Language/i)).toBeInTheDocument();
        expect(screen.getByText(/Native Language/i)).toBeInTheDocument();
    });

    it('should update source language', () => {
        render(<AiSetup />);
        const sourceSelect = screen.getByTestId('select-Foreign Language 🌍');
        fireEvent.change(sourceSelect, { target: { value: 'en' } });
        expect(mockUpdateConfig).toHaveBeenCalledWith({ sourceLang: 'en' });
    });

    it('should update target language', () => {
        render(<AiSetup />);
        const targetSelect = screen.getByTestId('select-Native Language 🏠');
        fireEvent.change(targetSelect, { target: { value: 'es' } });
        expect(mockUpdateConfig).toHaveBeenCalledWith({ targetLang: 'es' });
    });

    it('should swap languages', () => {
        render(<AiSetup />);
        const swapBtn = screen.getByTitle('Swap Languages');
        fireEvent.click(swapBtn);
        expect(mockUpdateConfig).toHaveBeenCalledWith({
            sourceLang: 'en',
            targetLang: 'es'
        });
    });
});
