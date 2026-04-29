import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useAudioStore } from '../store/useAudioStore';

export function FloatingContextMenu() {
    const [position, setPosition] = useState<{ x: number, y: number, text: string } | null>(null);

    useEffect(() => {
        const handleMouseUp = () => {
            const selection = window.getSelection();
            // Timeout to allow selection to settle
            setTimeout(() => {
                if (selection && selection.toString().trim().length > 0 && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    // Don't show if the selection is empty/invisible
                    if (rect.width === 0) return;
                    setPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10,
                        text: selection.toString().trim()
                    });
                } else {
                    setPosition(null);
                }
            }, 10);
        };

        const handleMouseDown = (e: MouseEvent) => {
             const target = e.target as HTMLElement;
             if (!target.closest('#floating-context-menu')) {
                 setPosition(null);
             }
        };

        // document-level listening for selections
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    if (!position) return null;

    return (
        <div 
            id="floating-context-menu"
            className="fixed z-[500] flex items-center gap-1 p-1 bg-popover/95 backdrop-blur-md shadow-xl border rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{ 
                left: position.x, 
                top: position.y, 
                transform: 'translate(-50%, -100%)' 
            }}
        >
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/20 hover:text-primary" onClick={() => useAudioStore.getState().playSingle(position.text)}>
                <Volume2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
