import { useState, useEffect } from 'react';

export function useAvailableModels(apiUrl: string) {
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    useEffect(() => {
        const url = apiUrl || 'http://localhost:3000';
        fetch(`${url}/api/tags`)
            .then((r) => r.json())
            .then((data) => {
                const names = (data?.models || []).map((m: { name: string }) => m.name);
                setAvailableModels(names);
            })
            .catch(() => {});
    }, [apiUrl]);

    return { availableModels };
}
