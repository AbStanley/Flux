import { useReaderStore } from './store/useReaderStore';
import { ReaderMainPanel } from './components/ReaderMainPanel';
import { ReaderSidebar } from './components/ReaderSidebar';
import { SavedWordsPanel } from './components/SavedWordsPanel';
import { useSessionAutoSave } from './hooks/useSessionAutoSave';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useTranslationStore } from './store/useTranslationStore';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

const premiumEase = [0.22, 1, 0.36, 1] as const;

const MotionDiv = motion.create('div');

export function ReaderView() {
    const activePanel = useReaderStore(state => state.activePanel);
    const isZenMode = useReaderStore(state => state.isZenMode);
    const isRichInfoOpen = useTranslationStore(state => state.isRichInfoOpen);
    
    const isSidebarOpen = (activePanel === 'SAVED_WORDS' || isRichInfoOpen);

    useSessionAutoSave();
    useGlobalShortcuts();

    return (
        <MotionDiv
            animate={{
                gap: isSidebarOpen ? '1.5rem' : '0rem',
            }}
            transition={{ duration: 0.5, ease: premiumEase }}
            className={cn(
                "relative flex flex-col min-[1200px]:flex-row w-full flex-1 h-full min-h-0",
                isZenMode ? 'max-w-4xl mx-auto my-0' : 'max-w-full'
            )}
        >
            <MotionDiv className="flex-1 flex flex-col min-h-0">
                <ReaderMainPanel />
            </MotionDiv>
            <MotionDiv
                animate={{
                    opacity: isSidebarOpen ? 1 : 0,
                    x: isSidebarOpen ? 0 : 80,
                }}
                transition={{ duration: 0.5, ease: premiumEase }}
                className="flex flex-col"
                style={{
                    visibility: isSidebarOpen ? 'visible' : 'hidden',
                }}
            >
                {activePanel === 'SAVED_WORDS' ? <SavedWordsPanel /> : <ReaderSidebar />}
            </MotionDiv>
        </MotionDiv>
    );
};
