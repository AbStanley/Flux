import { useState, useEffect } from 'react';
import { useConversationStore } from '../store/useConversationStore';
import { useServices } from '../../../contexts/ServiceContext';
import { Button } from '../../../components/ui/button';
import { MessageCircle } from 'lucide-react';
import { LANGUAGES, TOPICS } from '../constants';

export function SetupScreen() {
    const { targetLanguage, nativeLanguage, topic, model, setConfig, startConversation } =
        useConversationStore();
    const { aiService } = useServices();
    const [models, setModels] = useState<string[]>([]);

    useEffect(() => {
        aiService.getAvailableModels().then(setModels);
    }, [aiService]);

    useEffect(() => {
        if (!model && aiService.getModel()) {
            setConfig({ model: aiService.getModel() });
        }
    }, [model, aiService, setConfig]);

    return (
        <div className="container py-8 max-w-xl mx-auto space-y-8 animate-in fade-in">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Conversation Practice</h2>
                <p className="text-muted-foreground">Chat with an AI partner in your target language.</p>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <label className="space-y-1.5">
                        <span className="text-sm font-medium text-foreground">I speak</span>
                        <select
                            value={nativeLanguage}
                            onChange={(e) => setConfig({ nativeLanguage: e.target.value })}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {LANGUAGES.map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </label>
                    <label className="space-y-1.5">
                        <span className="text-sm font-medium text-foreground">I'm learning</span>
                        <select
                            value={targetLanguage}
                            onChange={(e) => setConfig({ targetLanguage: e.target.value })}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {LANGUAGES.map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <label className="space-y-1.5 block">
                    <span className="text-sm font-medium text-foreground">Topic</span>
                    <select
                        value={topic}
                        onChange={(e) => setConfig({ topic: e.target.value })}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        {TOPICS.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </label>

                {models.length > 0 && (
                    <label className="space-y-1.5 block">
                        <span className="text-sm font-medium text-foreground">Model</span>
                        <select
                            value={model}
                            onChange={(e) => setConfig({ model: e.target.value })}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {models.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            <div className="flex justify-center">
                <Button
                    size="lg"
                    onClick={startConversation}
                    disabled={!targetLanguage || !nativeLanguage}
                    className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 gap-2"
                >
                    <MessageCircle className="w-4 h-4" />
                    Start Conversation
                </Button>
            </div>
        </div>
    );
}
