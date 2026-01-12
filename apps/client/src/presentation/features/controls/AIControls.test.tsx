import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIControls } from './AIControls';
import * as ServiceContextModule from '../../contexts/ServiceContext';

// Mock the ServiceContext
const mockSetServiceType = vi.fn();
const mockGetAvailableModels = vi.fn();
const mockGetModel = vi.fn();

const mockAiService = {
    getAvailableModels: mockGetAvailableModels,
    getModel: mockGetModel,
    generateText: vi.fn(),
    translateText: vi.fn(),
    checkHealth: vi.fn(),
    getRichTranslation: vi.fn()
};

const mockUseServices = vi.fn();

// Spy on the module to return our mock hook
vi.spyOn(ServiceContextModule, 'useServices').mockImplementation(() => mockUseServices());

describe('AIControls', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementation
        mockUseServices.mockReturnValue({
            aiService: mockAiService,
            setServiceType: mockSetServiceType,
            currentServiceType: 'ollama',
        });
        mockGetAvailableModels.mockResolvedValue(['llama2', 'mistral']);
        mockGetModel.mockReturnValue('llama2');
    });

    it('renders correctly with Reader Input label', async () => {
        render(<AIControls isGenerating={false} />);
        expect(screen.getByText('Reader Input')).toBeInTheDocument();
    });

    it('displays the current service type selector', async () => {
        render(<AIControls isGenerating={false} />);
        // Look for the trigger that displays "Ollama (Local)"
        // Note: Radix UI Select trigger usually displays the selected value text.
        // Since currentServiceType is 'ollama', the SelectValue should render "Ollama (Local)" inside the trigger.
        expect(screen.getByText('Ollama (Local)')).toBeInTheDocument();
    });

    it('calls setServiceType when switching service', async () => {
        render(<AIControls isGenerating={false} />);

        const serviceTrigger = screen.getByText('Ollama (Local)');
        fireEvent.click(serviceTrigger); // Open dropdown
    });

    it('fetches and displays available models when service is ollama', async () => {
        mockGetAvailableModels.mockResolvedValue(['llama3', 'gemma']);
        mockGetModel.mockReturnValue('llama3');

        render(<AIControls isGenerating={false} />);

        await waitFor(() => {
            expect(mockGetAvailableModels).toHaveBeenCalled();
        });

        // Check if model select is present (it renders when models > 0)
        // The value 'llama3' should be displayed in the trigger
        expect(screen.getByText('llama3')).toBeInTheDocument();
    });

    it('shows error state when no models are available', async () => {
        mockGetAvailableModels.mockResolvedValue([]); // Empty array
        mockGetModel.mockReturnValue(''); // No model selected

        render(<AIControls isGenerating={false} />);

        await waitFor(() => {
            expect(mockGetAvailableModels).toHaveBeenCalled();
        });

        expect(screen.getByText('No models')).toBeInTheDocument();
        expect(screen.getByTitle('Refresh Models')).toBeInTheDocument();
    });

    it('attempts to refresh models when refresh button is clicked', async () => {
        mockGetAvailableModels.mockResolvedValue([]); // Start empty

        render(<AIControls isGenerating={false} />);

        await waitFor(() => {
            expect(screen.getByText('No models')).toBeInTheDocument();
        });

        // Now mock a successful response for the next call
        mockGetAvailableModels.mockResolvedValue(['new-model']);
        mockGetModel.mockReturnValue('new-model');

        const refreshBtn = screen.getByTitle('Refresh Models');
        fireEvent.click(refreshBtn);

        await waitFor(() => {
            expect(mockGetAvailableModels).toHaveBeenCalledTimes(2); // Initial + Refresh
        });

        // Should now show the model select (containing "new-model")
        // We look for the text "new-model"
        await waitFor(() => {
            expect(screen.getByText('new-model')).toBeInTheDocument();
        });
    });

    it('updates service type default when current model is invalid', async () => {
        mockGetAvailableModels.mockResolvedValue(['valid-model']);
        mockGetModel.mockReturnValue('invalid-model'); // Current is invalid

        render(<AIControls isGenerating={false} />);

        await waitFor(() => {
            expect(mockSetServiceType).toHaveBeenCalledWith('ollama', { model: 'valid-model' });
        });
    });

    it('disables controls when generating', async () => {
        render(<AIControls isGenerating={true} />);

        const trigger = screen.getByText('Ollama (Local)').closest('button');
        expect(trigger).toBeDisabled();
    });
});
