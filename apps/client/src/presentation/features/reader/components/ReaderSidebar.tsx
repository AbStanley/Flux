import React from 'react';
import { RichInfoPanel } from './RichInfoPanel';
import { useTranslation } from '../hooks/useTranslation';

export const ReaderSidebar: React.FC = () => {
    const {
        richDetailsTabs,
        activeTabId,
        isRichInfoOpen,
        closeRichInfo,
        setActiveTab,
        closeTab,
        closeAllTabs,
        regenerateTab
    } = useTranslation(true);

    return (
        <div className={`hidden min-[1200px]:flex flex-col flex-shrink-0 relative overflow-hidden h-full transition-all duration-300 ${isRichInfoOpen ? 'w-[500px] pl-2' : 'w-0 pl-0'
            }`}>
            <div className="w-[450px] h-full"> {/* Fixed width inner container to prevent content squashing during transition */}
                <RichInfoPanel
                    isOpen={isRichInfoOpen}
                    tabs={richDetailsTabs}
                    activeTabId={activeTabId}
                    onClose={closeRichInfo}
                    onTabChange={setActiveTab}
                    onCloseTab={closeTab}
                    onRegenerate={regenerateTab}
                    onClearAll={closeAllTabs}
                />
            </div>
        </div>
    );
};
