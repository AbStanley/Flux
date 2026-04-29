import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

interface FocusLayoutProps {
    isReading: boolean;
    hasText: boolean;
    onBackToConfig: () => void;
    controlPanelSlot: ReactNode;
    readerViewSlot: ReactNode;
}

const premiumEase = [0.22, 1, 0.36, 1] as const;
const MotionDiv = motion.create('div');

export const FocusLayout: React.FC<FocusLayoutProps> = ({
    isReading,
    hasText,
    onBackToConfig,
    controlPanelSlot,
    readerViewSlot,
}) => {
    return (
        <div className={`flex flex-col gap-4 relative w-full flex-1 ${isReading ? 'h-full overflow-hidden' : ''}`}>
            <AnimatePresence mode="wait">
                {!isReading ? (
                    <MotionDiv
                        key="control-panel"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, filter: 'blur(8px)', y: -40 }}
                        transition={{ duration: 0.5, ease: premiumEase }}
                        className="w-full overflow-hidden"
                    >
                        <div className="py-1">
                            {controlPanelSlot}
                        </div>
                    </MotionDiv>
                ) : (
                    <MotionDiv
                        key="reader-view"
                        initial={{ opacity: 0, y: 60, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ duration: 0.7, ease: premiumEase }}
                        className="w-full flex-1 flex flex-col gap-2 overflow-hidden"
                    >
                        <MotionDiv
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.4, ease: premiumEase }}
                        >
                            <Button
                                variant="ghost"
                                onClick={onBackToConfig}
                                className="self-start mb-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 gap-2 pl-2 pr-4"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back to Configuration</span>
                                <span className="sm:hidden">Back</span>
                            </Button>
                        </MotionDiv>
                        {readerViewSlot}
                    </MotionDiv>
                )}
            </AnimatePresence>

            {/* Non-reading preview (no animation needed) */}
            {!isReading && hasText && (
                <div className="w-full flex-1 flex flex-col gap-2 overflow-hidden">
                    {readerViewSlot}
                </div>
            )}
        </div>
    );
};
