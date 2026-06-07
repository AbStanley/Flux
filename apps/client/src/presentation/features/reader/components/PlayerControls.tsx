import { useEffect, useState } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { useReaderStore } from '../store/useReaderStore';
import { DesktopPlayerControls } from './DesktopPlayerControls';
import { MobilePlayerControls } from './MobilePlayerControls';

export function PlayerControls() {
    const { init, setTokens } = useAudioStore();
    const { text, tokens: readerTokens } = useReaderStore();
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        init();
    }, [init]);

    // Sync tokens
    useEffect(() => {
        // Sanitize tokens for audio: remove # tags (headers)
        // We replace them with empty strings to keep indices in sync for highlighting
        const sanitizedTokens = readerTokens.map(t => /^#+$/.test(t.trim()) ? "" : t);
        setTokens(sanitizedTokens);
    }, [readerTokens, setTokens]);

    if (!text.trim()) return null;

    const handleToggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    return (
        <>
            <DesktopPlayerControls 
                isCollapsed={isCollapsed} 
                onToggleCollapse={handleToggleCollapse} 
            />
            <MobilePlayerControls 
                isCollapsed={isCollapsed} 
                onToggleCollapse={handleToggleCollapse} 
            />
        </>
    );
}
