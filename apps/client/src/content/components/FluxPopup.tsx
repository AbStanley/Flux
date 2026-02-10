import { useState, useRef, useEffect } from 'react';
import type { Mode } from '../hooks/useAIHandler';
import { FluxHeader } from './FluxHeader';
import { FluxControls } from './FluxControls';
import { FluxContent } from './FluxContent';

interface FluxPopupProps {
    selection: { text: string; x: number; y: number };
    result: string;
    loading: boolean;
    error: string | null;
    mode: Mode;
    targetLang: string;
    sourceLang?: string;
    onModeChange: (mode: Mode) => void;
    onLangChange: (lang: string) => void;
    onSourceLangChange?: (lang: string) => void;
    onAction: () => void;
    onClose: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onPinChange?: (pinned: boolean) => void;
    onAutoPlay?: () => void;
    onSave?: (text: string) => void;
    autoSave: boolean;
    onAutoSaveChange: (enabled: boolean) => void;
    isSaving?: boolean;
}

export function FluxPopup({
    selection,
    result,
    loading,
    error,
    mode,
    targetLang,
    sourceLang,
    onModeChange,
    onLangChange,
    onSourceLangChange,
    onAction,
    onClose,
    onMouseEnter,
    onMouseLeave,
    onPinChange,
    onAutoPlay,
    onSave,
    autoSave,
    onAutoSaveChange,
    isSaving
}: FluxPopupProps) {
    const [prevSelection, setPrevSelection] = useState(selection);
    const [isPinned, setIsPinned] = useState(false);
    const [pos, setPos] = useState({ x: selection.x, y: selection.y });
    const [isDragging, setIsDragging] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    // Derived state: Sync position when selection changes, but ONLY if not dragging or pinned
    if (selection !== prevSelection) {
        setPrevSelection(selection);
        if (!isDragging && !isPinned) {
            setPos({ x: selection.x, y: selection.y });
        }
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only allow dragging from the header area (top of the box)
        setIsDragging(true);

        // Auto-pin when starting to drag so it doesn't snap back to words
        if (!isPinned) {
            setIsPinned(true);
            if (onPinChange) onPinChange(true);
        }

        dragStart.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y
        };
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPos({
                x: e.clientX - dragStart.current.x,
                y: e.clientY - dragStart.current.y
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleClose = () => {
        setIsPinned(false);
        onClose();
    };

    const handleInternalSave = () => {
        if (onSave) {
            onSave(selection.text);
        } else {
            // Default internal logic if no specialized onSave provided
            if (window.chrome?.runtime) {
                window.chrome.runtime.sendMessage({ type: 'TEXT_SELECTED', text: selection.text });
                window.chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
            }
        }
    };

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={() => {
                if (!isPinned) onMouseLeave();
                if (onAutoPlay) onAutoPlay(); // Play video when leaving box, even if pinned
            }}
            style={{
                position: 'fixed', // Use fixed for better stability during scroll/drag
                left: pos.x,
                top: pos.y,
                zIndex: 2147483647,
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: isDragging ? 'none' : 'all 0.1s ease-out'
            }}
            onMouseDown={e => e.stopPropagation()}
        >
            <div style={{
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                color: '#f8fafc',
                width: isCollapsed ? '240px' : '320px',
                padding: isCollapsed ? '12px 16px' : '20px',
                borderRadius: '20px',
                boxShadow: isDragging
                    ? '0 30px 60px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                fontSize: `16px`,
                lineHeight: '1.6',
                display: 'flex',
                flexDirection: 'column',
                gap: isCollapsed ? '8px' : '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transform: isDragging ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                <div onMouseDown={handleMouseDown}>
                    <FluxHeader
                        onClose={handleClose}
                        onPinToggle={() => {
                            const newPinned = !isPinned;
                            setIsPinned(newPinned);
                            if (onPinChange) onPinChange(newPinned);
                        }}
                        onSave={handleInternalSave}
                        isPinned={isPinned}
                        isCollapsed={isCollapsed}
                        onCollapseToggle={() => setIsCollapsed(!isCollapsed)}
                    />
                </div>

                {!isCollapsed && (
                    <FluxControls
                        mode={mode}
                        targetLang={targetLang}
                        sourceLang={sourceLang}
                        result={result}
                        selection={selection}
                        onModeChange={onModeChange}
                        onLangChange={onLangChange}
                        onSourceLangChange={onSourceLangChange}
                        onAction={onAction}
                        autoSave={autoSave}
                        onAutoSaveChange={onAutoSaveChange}
                        isSaving={isSaving}
                    />
                )}

                <FluxContent
                    loading={loading}
                    error={error}
                    result={result}
                />
            </div>
        </div>
    );
}
