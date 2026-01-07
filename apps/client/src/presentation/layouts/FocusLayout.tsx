import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../components/ui/button';

interface FocusLayoutProps {
    isReading: boolean;
    hasText: boolean;
    onBackToConfig: () => void;
    controlPanelSlot: React.ReactNode;
    readerViewSlot: React.ReactNode;
}

export const FocusLayout: React.FC<FocusLayoutProps> = ({
    isReading,
    hasText,
    onBackToConfig,
    controlPanelSlot,
    readerViewSlot,
}) => {
    return (
        <div className={`flex flex-col gap-4 relative w-full flex-1 ${isReading ? 'h-full overflow-hidden' : ''}`}>
            <AnimatePresence>
                {!isReading && (
                    <motion.div
                        key="control-panel"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="w-full overflow-hidden"
                    >
                        <div className="py-1">
                            {controlPanelSlot}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {hasText && (
                <motion.div
                    layout
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="w-full flex-1 flex flex-col gap-2 overflow-hidden"
                >
                    <AnimatePresence>
                        {isReading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                <Button
                                    variant="ghost"
                                    onClick={onBackToConfig}
                                    className="self-start mb-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    ← Back to Configuration
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {readerViewSlot}
                </motion.div>
            )}
        </div>
    );
};
