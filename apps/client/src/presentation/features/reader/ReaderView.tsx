import { useReaderStore } from './store/useReaderStore';
import { ReaderMainPanel } from './components/ReaderMainPanel';
import { ReaderSidebar } from './components/ReaderSidebar';
import { SavedWordsPanel } from './components/SavedWordsPanel';
import { useSessionAutoSave } from './hooks/useSessionAutoSave';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';

export function ReaderView() {
    const activePanel = useReaderStore(state => state.activePanel);
    const isZenMode = useReaderStore(state => state.isZenMode);
    useSessionAutoSave();
    useGlobalShortcuts();

    return (
        <div className={`relative flex flex-col min-[1200px]:flex-row w-full flex-1 h-full min-h-0 mx-auto my-0 transition-all duration-500 gap-6 ${isZenMode ? 'max-w-4xl' : 'max-w-full'}`}>
            <ReaderMainPanel />
            {!isZenMode && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 min-[1200px]:w-[400px]">
                    {activePanel === 'SAVED_WORDS' ? <SavedWordsPanel /> : <ReaderSidebar />}
                </div>
            )}
        </div>
    );
};



