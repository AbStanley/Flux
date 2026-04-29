import { useReaderStore } from './store/useReaderStore';
import { ReaderMainPanel } from './components/ReaderMainPanel';
import { ReaderSidebar } from './components/ReaderSidebar';
import { SavedWordsPanel } from './components/SavedWordsPanel';
import { useSessionAutoSave } from './hooks/useSessionAutoSave';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { motion } from 'framer-motion';

const premiumEase = [0.22, 1, 0.36, 1] as const;

const MotionDiv = motion.create('div');

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.3,
            delayChildren: 0.2,
        },
    },
} as const;

const mainPanelVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.4, ease: premiumEase },
    },
} as const;

const sidebarVariants = {
    hidden: { opacity: 0, x: 80 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.7, ease: premiumEase },
    },
} as const;

export function ReaderView() {
    const activePanel = useReaderStore(state => state.activePanel);
    const isZenMode = useReaderStore(state => state.isZenMode);
    useSessionAutoSave();
    useGlobalShortcuts();

    return (
        <MotionDiv
            layout
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`relative flex flex-col min-[1200px]:flex-row w-full flex-1 h-full min-h-0 mx-auto my-0 transition-all duration-500 gap-6 ${isZenMode ? 'max-w-4xl' : 'max-w-full'}`}
        >
            <MotionDiv variants={mainPanelVariants} className="flex-1 flex flex-col min-h-0">
                <ReaderMainPanel />
            </MotionDiv>
            {!isZenMode && (
                <MotionDiv
                    variants={sidebarVariants}
                    className="min-[1200px]:w-[400px]"
                >
                    {activePanel === 'SAVED_WORDS' ? <SavedWordsPanel /> : <ReaderSidebar />}
                </MotionDiv>
            )}
        </MotionDiv>
    );
};
