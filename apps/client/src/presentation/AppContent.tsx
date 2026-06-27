import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { NavBar } from './components/navigation/NavBar';
import { useViewStore } from './features/navigation/store/useViewStore';
import { AppView } from './features/navigation/types';
import { WordManager } from './features/word-manager';
import { LearningModePage } from './features/learning-mode/LearningModePage';
import { WritingModePage } from './features/interactive-writing/WritingModePage';
import { SrsReviewPage } from './features/srs-review/SrsReviewPage';
import { ConversationPage } from './features/conversation/ConversationPage';
import { StatsPage } from './features/stats/StatsPage';
import { useSettingsSync } from './hooks/useSettingsSync';
import { useFocusMode } from './features/reader/hooks/useFocusMode';
import { FocusLayout } from './layouts/FocusLayout';
import { ControlPanel } from './features/controls/ControlPanel';
import { ReaderView } from './features/reader/ReaderView';
import { useReaderStore } from './features/reader/store/useReaderStore';
import { Button } from './components/ui/button';

export function AppContent() {
  const { isReading, hasText, exitReaderMode } = useFocusMode();
  const currentView = useViewStore(state => state.currentView);
  
  // Synchronize settings with backend
  useSettingsSync();

  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll listener for floating button
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 800);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // If in Word Manager view, show NavBar and Word Manager
  if (currentView === AppView.WordManager) {
    return (
      <>
        <NavBar />
        <WordManager />
      </>
    );
  }

  if (currentView === AppView.LearningMode) {
    return (
      <>
        <NavBar />
        <LearningModePage />
      </>
    );
  }

  if (currentView === AppView.SrsReview) {
    return (
      <>
        <NavBar />
        <SrsReviewPage />
      </>
    );
  }

  if (currentView === AppView.InteractiveWriting) {
    return (
      <>
        <NavBar />
        <WritingModePage />
      </>
    );
  }

  if (currentView === AppView.Conversation) {
    return (
      <>
        <NavBar />
        <ConversationPage />
      </>
    );
  }

  if (currentView === AppView.Stats) {
    return (
      <>
        <NavBar />
        <StatsPage />
      </>
    );
  }

  return (
    <>
      {!isReading && <NavBar />}

      <FocusLayout
        isReading={isReading}
        hasText={hasText}
        onBackToConfig={exitReaderMode}
        controlPanelSlot={<ControlPanel />}
        readerViewSlot={<ReaderView />}
      />

      {/* Floating Action Button for Reading Mode - Desktop only, hidden when at top */}
      {!isReading && hasText && currentView === AppView.Reading && isScrolled && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-[500] hidden sm:flex"
        >
          <Button
            onClick={() => useReaderStore.getState().setIsReading(true)}
            size="lg"
            className="rounded-full shadow-2xl h-14 px-6 gap-3 bg-green-600 hover:bg-green-700 text-white border-2 border-white/20 transition-transform hover:scale-105 active:scale-95"
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-bold tracking-tight">Open Reading Mode</span>
          </Button>
        </motion.div>
      )}
    </>
  );
}
