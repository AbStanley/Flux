// In-Page UI Component
import { useState, useRef, useEffect } from 'react';
import { useAIHandler, type Mode } from './hooks/useAIHandler';
import { useTextSelection } from './hooks/useTextSelection';
import { FluxPopup } from './components/FluxPopup';

type ViewState = 'HIDDEN' | 'FAB' | 'POPUP';

/**
 * FluxContentApp: The In-Page Extension UI
 * 
 * Refactored to use Content Bootstrapping pattern and Custom Hooks.
 */
export const FluxContentApp: React.FC = () => {
    const [view, setView] = useState<ViewState>('HIDDEN');
    const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);
    const [mode, setMode] = useState<Mode>('TRANSLATE');
    const [targetLang, setTargetLang] = useState<string>('English');

    const isHoveringRef = useRef(false);

    // AI Logic
    const { result, loading, error, handleAction } = useAIHandler();

    // Selection Logic
    // We wrap callbacks to ensure they have latest state if needed, 
    // though the hook dependency array handles updates.
    const onSelectionDetected = (newSelection: { text: string, x: number, y: number }) => {
        setSelection(newSelection);
        setView('POPUP');

        // AUTO-TRIGGER
        // Use current state for mode and lang
        handleAction(newSelection.text, mode, targetLang);
    };

    const onClearSelection = () => {
        setView('HIDDEN');
        setSelection(null);
    };

    useTextSelection(isHoveringRef, onSelectionDetected, onClearSelection);

    useEffect(() => {
        console.log('[Flux] Component Mounted');
    }, []);

    const onManualAction = () => {
        if (selection) {
            handleAction(selection.text, mode, targetLang);
        }
    };

    if (view === 'HIDDEN' || !selection) return null;

    return (
        <FluxPopup
            selection={selection}
            result={result}
            loading={loading}
            error={error}
            mode={mode}
            targetLang={targetLang}
            onModeChange={setMode}
            onLangChange={setTargetLang}
            onAction={onManualAction}
            onClose={() => setView('HIDDEN')}
            onMouseEnter={() => isHoveringRef.current = true}
            onMouseLeave={() => isHoveringRef.current = false}
        />
    );
};
