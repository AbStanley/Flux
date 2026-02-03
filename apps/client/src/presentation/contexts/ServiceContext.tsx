import { createContext, useContext, useState, type ReactNode } from 'react';
import type { IAIService } from '../../core/interfaces/IAIService';
import { MockAIService } from '../../infrastructure/ai/MockAIService';
import { ServerAIService } from '../../infrastructure/ai/ServerAIService';
import { useReaderStore } from '../features/reader/store/useReaderStore';

interface OllamaConfig {
    url?: string;
    model?: string;
}

interface ServiceContextType {
    aiService: IAIService;
    setServiceType: (type: 'mock' | 'ollama', config?: OllamaConfig) => void;
    currentServiceType: 'mock' | 'ollama';
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
    // Default to Backend API
    const defaultUrl = 'http://localhost:3002/api';
    const initialUrl = import.meta.env.VITE_AI_API_URL ?? defaultUrl;

    // Get persisted model from store to survive page refreshes
    const persistedModel = useReaderStore((s) => s.aiModel);

    const [aiService, setAiService] = useState<IAIService>(() => new ServerAIService(initialUrl, persistedModel));
    const [currentServiceType, setCurrentServiceType] = useState<'mock' | 'ollama'>('ollama');

    // Get the setter from the store to persist model changes
    const setAiModel = useReaderStore((s) => s.setAiModel);

    const setServiceType = (type: 'mock' | 'ollama', config?: OllamaConfig) => {
        setCurrentServiceType(type);
        if (type === 'ollama') {
            // Use config.url if provided.
            const url = config?.url ?? import.meta.env.VITE_AI_API_URL ?? defaultUrl;
            setAiService(new ServerAIService(url, config?.model));

            // Persist model selection to store for page refresh survival
            if (config?.model) {
                setAiModel(config.model);
            }
        } else {
            setAiService(new MockAIService());
        }
    };

    return (
        <ServiceContext value={{ aiService, setServiceType, currentServiceType }}>
            {children}
        </ServiceContext>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useServices = () => {
    const context = useContext(ServiceContext);
    if (!context) {
        throw new Error('useServices must be used within a ServiceProvider');
    }
    return context;
};
