import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { IAIService } from '../../core/interfaces/IAIService';
import { MockAIService } from '../../infrastructure/ai/MockAIService';
import { ServerAIService } from '../../infrastructure/ai/ServerAIService';
import { useReaderStore } from '../features/reader/store/useReaderStore';

interface OllamaConfig {
    model?: string;
}

interface ServiceContextType {
    aiService: IAIService;
    setServiceType: (type: 'mock' | 'ollama', config?: OllamaConfig) => void;
    currentServiceType: 'mock' | 'ollama';
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
    // Get persisted model from store
    const persistedModel = useReaderStore((s) => s.aiModel);
    const [currentServiceType, setCurrentServiceType] = useState<'mock' | 'ollama'>('ollama');

    // Initialize aiService state
    const [aiService, setAiService] = useState<IAIService>(() => {
        if (currentServiceType === 'ollama') {
            return new ServerAIService(persistedModel);
        }
        return new MockAIService();
    });

    // Update service when persisted model changes (e.g. from hydration or other tabs)
    useEffect(() => {
        if (currentServiceType === 'ollama' && persistedModel) {
            aiService.setModel(persistedModel);
        }
    }, [persistedModel, currentServiceType, aiService]);

    // Get the setter from the store to persist model changes
    const setAiModel = useReaderStore((s) => s.setAiModel);

    const setServiceType = (type: 'mock' | 'ollama', config?: OllamaConfig) => {
        setCurrentServiceType(type);
        if (type === 'ollama') {
            // Note: URL config is no longer passed to ServerAIService as it uses ApiClient
            const newService = new ServerAIService(config?.model || persistedModel);
            setAiService(newService);

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
