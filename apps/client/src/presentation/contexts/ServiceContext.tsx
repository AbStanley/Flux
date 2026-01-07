import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { IAIService } from '../../core/interfaces/IAIService';
import { MockAIService } from '../../infrastructure/ai/MockAIService';
import { OllamaService } from '../../infrastructure/ai/OllamaService';

interface ServiceContextType {
    aiService: IAIService;
    setServiceType: (type: 'mock' | 'ollama', config?: any) => void;
    currentServiceType: 'mock' | 'ollama';
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export const ServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // In both PROD (Web) and DEV, we prefer relative paths ('') to allow Proxying (Vite/Nginx).
    // The OllamaService itself will fallback to localhost ONLY if it detects it's running as an Extension.
    const defaultUrl = '';
    const initialUrl = import.meta.env.VITE_OLLAMA_URL ?? defaultUrl;

    const [aiService, setAiService] = useState<IAIService>(new OllamaService(initialUrl));
    const [currentServiceType, setCurrentServiceType] = useState<'mock' | 'ollama'>('ollama');

    const setServiceType = (type: 'mock' | 'ollama', config?: any) => {
        setCurrentServiceType(type);
        if (type === 'ollama') {
            // Use config.url if provided.
            const url = config?.url ?? import.meta.env.VITE_OLLAMA_URL ?? defaultUrl;
            setAiService(new OllamaService(url, config?.model));
        } else {
            setAiService(new MockAIService());
        }
    };

    return (
        <ServiceContext.Provider value={{ aiService, setServiceType, currentServiceType }}>
            {children}
        </ServiceContext.Provider>
    );
};

export const useServices = () => {
    const context = useContext(ServiceContext);
    if (!context) {
        throw new Error('useServices must be used within a ServiceProvider');
    }
    return context;
};
