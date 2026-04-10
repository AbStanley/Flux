import { useState, useEffect, useRef } from 'react';
import { defaultClient } from '@/infrastructure/api/api-client';

export interface OllamaModel {
    name: string;
    size: number;
    modified_at: string;
}

export function useModelManager() {
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [pullName, setPullName] = useState('');
    const [pulling, setPulling] = useState(false);
    const [pullProgress, setPullProgress] = useState(0);
    const [pullStatus, setPullStatus] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const fetchModels = () => {
        setLoading(true);
        defaultClient.get<{ models: OllamaModel[] }>('/api/tags')
            .then((data) => setModels(data?.models || []))
            .catch(() => setModels([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchModels(); }, []);

    const handlePull = async () => {
        const name = pullName.trim();
        if (!name || pulling) return;
        setPulling(true);
        setPullProgress(0);
        setPullStatus('Starting...');

        try {
            const baseUrl = defaultClient.getBaseUrl();
            abortRef.current = new AbortController();
            const res = await fetch(`${baseUrl}/api/models/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: name }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) throw new Error(`Failed: ${res.status}`);

            const reader = res.body?.getReader();
            if (!reader) throw new Error('No stream');
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        setPullStatus(data.status || '');
                        if (data.total && data.completed) {
                            setPullProgress(Math.round((data.completed / data.total) * 100));
                        }
                    } catch { /* skip */ }
                }
            }

            setPullName('');
            fetchModels();
        } catch (e) {
            if (e instanceof Error && e.name !== 'AbortError') {
                setPullStatus(`Error: ${e.message}`);
            }
        } finally {
            setPulling(false);
            abortRef.current = null;
        }
    };

    const handleDelete = async (name: string) => {
        if (deleting) return;
        setDeleting(name);
        try {
            await fetch(`${defaultClient.getBaseUrl()}/api/models`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: name }),
            });
            setModels((prev) => prev.filter((m) => m.name !== name));
        } catch { /* skip */ }
        finally { setDeleting(null); }
    };

    return {
        models, loading,
        pullName, setPullName, pulling, pullProgress, pullStatus,
        deleting, handlePull, handleDelete,
    };
}

export function formatSize(bytes: number) {
    if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes > 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
    return `${bytes} B`;
}
