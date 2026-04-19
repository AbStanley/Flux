import { RichInfoPanel } from './RichInfoPanel';
import { useTranslation } from '../hooks/useTranslation';
import { useReaderStore } from '../store/useReaderStore';

export function ReaderSidebar() {
    const isReading = useReaderStore(state => state.isReading);
    const {
        richDetailsTabs,
        activeTabId,
        isRichInfoOpen,
        closeRichInfo,
        setActiveTab,
        closeTab,
        closeAllTabs,
        regenerateTab,
        fetchConjugationsForTab
    } = useTranslation(true);

    // When not in reading mode, the container is narrow (max-w-4xl) — show panel as
    // a fixed overlay instead of a sidebar to avoid cramping the text.
    if (!isReading) {
        return (
            <RichInfoPanel
                isOpen={isRichInfoOpen}
                tabs={richDetailsTabs}
                activeTabId={activeTabId}
                onClose={closeRichInfo}
                onTabChange={setActiveTab}
                onCloseTab={closeTab}
                onRegenerate={regenerateTab}
                onFetchConjugations={fetchConjugationsForTab}
                onClearAll={closeAllTabs}
                forceOverlay
            />
        );
    }

    return (
        <div className={`hidden min-[1200px]:flex flex-col flex-shrink-0 relative overflow-hidden h-full transition-all duration-300 ${isRichInfoOpen ? 'w-[500px] pl-2' : 'w-0 pl-0'
            }`}>
            <div className="w-[450px] h-full">
                <RichInfoPanel
                    isOpen={isRichInfoOpen}
                    tabs={richDetailsTabs}
                    activeTabId={activeTabId}
                    onClose={closeRichInfo}
                    onTabChange={setActiveTab}
                    onCloseTab={closeTab}
                    onRegenerate={regenerateTab}
                    onFetchConjugations={fetchConjugationsForTab}
                    onClearAll={closeAllTabs}
                />
            </div>
        </div>
    );
};
