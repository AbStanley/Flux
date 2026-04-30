import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '@/lib/utils';

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
        <MotionDiv 
            animate={{
                gap: isReading ? '0.5rem' : '1rem',
            }}
            transition={{ duration: 0.5, ease: premiumEase }}
            className={cn(
                "flex flex-col relative w-full flex-1",
                isReading ? 'h-full overflow-hidden' : ''
            )}
        >
            <AnimatePresence mode="wait">
                {!isReading ? (
                    <MotionDiv
                        key="control-panel"
                        initial={{ opacity: 0, y: -40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -40, scale: 0.95, transition: { duration: 0.5, ease: premiumEase } }}
                        transition={{ duration: 0.7, ease: premiumEase }}
                        className="w-full flex-shrink-0"
                    >
                        <div className="py-1">
                            {controlPanelSlot}
                        </div>
                        
                        {/* Preview Slot - Rendered below control panel when not in reading mode */}
                        {hasText && (
                            <MotionDiv
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.7, ease: premiumEase }}
                                className="w-full mt-4"
                            >
                                {readerViewSlot}
                            </MotionDiv>
                        )}
                    </MotionDiv>
                ) : (
                    <MotionDiv
                        key="reader-view-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.4, ease: premiumEase } }}
                        transition={{ duration: 0.6, ease: premiumEase }}
                        className="w-full flex-1 flex flex-col gap-1 overflow-hidden z-10 h-full"
                    >
                        <MotionDiv
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.5, ease: premiumEase }}
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onBackToConfig}
                                className="self-start mb-0 hover:bg-neutral-100 dark:hover:bg-neutral-800 gap-2 pl-2 pr-4"
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
        </MotionDiv>
    );
};
