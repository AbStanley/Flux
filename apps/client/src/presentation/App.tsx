import { useEffect, useState } from 'react';
import { ServiceProvider } from './contexts/ServiceContext';
import { motion } from 'framer-motion';
import { ControlPanel } from './features/controls/ControlPanel';
import { ReaderView } from './features/reader/ReaderView';
import { useReaderStore } from './features/reader/store/useReaderStore';

import { FocusLayout } from './layouts/FocusLayout';
import { useFocusMode } from './features/reader/hooks/useFocusMode';
import { useGameStore } from './features/learning-mode/store/useGameStore';
import { useAuthStore } from './features/auth/store/useAuthStore';
import { authApi } from '@/infrastructure/api/auth';
import { LoginPage } from './features/auth/LoginPage';
import { Button } from './components/ui/button';

/**
 * App: The Main Application Root
 * 
 * This component serves two distinct purposes in the Hybrid Architecture:
 * 1. **Standalone Web App**: The main dashboard/reader interface.
 * 2. **Extension Side Panel**: The view shown in the Chrome Side Panel.
 * 
 * It listens for messages from the Extension (if present) to handle
 * cross-component actions like "Read in Flux".
 */
function App() {
  const isReading = useReaderStore(state => state.isReading);
  const setText = useReaderStore(state => state.setText);
  const setIsReading = useReaderStore(state => state.setIsReading);
  const config = useGameStore(state => state.config);

  // Auth: initialize from localStorage
  const { isAuthenticated, isLoading: authLoading, initialize } = useAuthStore();
  const isExtension = typeof window !== 'undefined'
    && window.location.protocol === 'chrome-extension:';

  // Initialize auth (handles both web and extension contexts)
  useEffect(() => {
    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // In extension: listen for auth changes from popup/other contexts
  useEffect(() => {
    if (!isExtension) return;

    // Listen for storage changes (popup login/logout)
    const handleStorageChange = (changes: Record<string, { newValue?: unknown }>) => {
      if ('flux_auth_token' in changes) {
        initialize(); // Re-initialize from chrome storage
      }
    };

    // Listen for explicit logout messages
    const handleMessage = (message: { type: string }) => {
      if (message.type === 'AUTH_LOGOUT') {
        authApi.clearStoredToken();
        useAuthStore.getState().logout();
      }
    };

    window.chrome?.storage?.onChanged?.addListener(handleStorageChange);
    window.chrome?.runtime?.onMessage?.addListener(handleMessage);
    return () => {
      window.chrome?.storage?.onChanged?.removeListener(handleStorageChange);
      window.chrome?.runtime?.onMessage?.removeListener(handleMessage);
    };
  }, [isExtension, initialize]);

  useEffect(() => {
    import('@/infrastructure/api/base-url').then(({ getApiBaseUrl }) => {
      const defaultUrl = getApiBaseUrl();
      let urlToSet = config.aiHost || defaultUrl;

      const isLocalhostConfig = urlToSet.includes('localhost') || urlToSet.includes('127.0.0.1');
      if (!isExtension && isLocalhostConfig) {
        urlToSet = '';
        useGameStore.getState().updateConfig({ aiHost: '' });
      }


      import('@/infrastructure/api/api-client').then(({ setApiClientBaseUrl }) => {
        setApiClientBaseUrl(urlToSet);
      });
    });
  }, [config.aiHost, isExtension]);

  useEffect(() => {
    type ChromeWindow = Window & {
      chrome?: {
        runtime?: {
          onMessage?: {
            addListener: (handler: (message: { type: string; text?: string }) => void) => void;
            removeListener: (handler: (message: { type: string; text?: string }) => void) => void;
          };
        };
        storage?: {
          local?: {
            get: (keys: string[], callback: (result: { pendingText?: string }) => void) => void;
            remove: (keys: string | string[]) => void;
          };
        };
      };
    };
    const w = window as ChromeWindow;
    if (w.chrome?.runtime?.onMessage) {
      const handleMessage = (message: { type: string; text?: string }) => {
        if (message.type === 'TEXT_SELECTED' && message.text) {
          setText(message.text);
          setIsReading(true);
        }
        if (message.type === 'WORD_SAVED') {
          import('@/presentation/features/word-manager/store/useWordsStore').then(({ useWordsStore }) => {
            useWordsStore.getState().fetchWords('word');
            useWordsStore.getState().fetchWords('phrase');
          });
        }
        if (message.type === 'AUTH_LOGOUT') {
          useAuthStore.getState().logout();
        }
      };
      w.chrome.runtime.onMessage.addListener(handleMessage);

      if (w.chrome.storage?.local) {
        w.chrome.storage.local.get(['pendingText'], (result: { pendingText?: string }) => {
          if (result.pendingText) {
            setText(result.pendingText);
            setIsReading(true);
            w.chrome.storage.local?.remove('pendingText');
          }
        });
      }

      return () => w.chrome?.runtime?.onMessage?.removeListener(handleMessage);
    }
  }, [setText, setIsReading]);

  // Auth gate: show login for unauthenticated users (both web app and side panel)
  if (authLoading) {
    return null;
  }
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <ServiceProvider>
      <div className={`container mx-auto ${isReading ? 'px-0 sm:px-4' : 'px-4'} flex flex-col ${isReading ? 'h-[100dvh] overflow-hidden max-w-[100vw] sm:max-w-[95vw]' : 'min-h-[100dvh] max-w-4xl py-4'}`}>
        <AppContent />
      </div>
    </ServiceProvider>
  );
}

import { NavBar } from './components/navigation/NavBar';
import { BookOpen } from 'lucide-react';
import { useViewStore } from './features/navigation/store/useViewStore';
import { AppView } from './features/navigation/types';
import { WordManager } from './features/word-manager';
import { LearningModePage } from './features/learning-mode/LearningModePage';
import { WritingModePage } from './features/interactive-writing/WritingModePage';
import { SrsReviewPage } from './features/srs-review/SrsReviewPage';
import { ConversationPage } from './features/conversation/ConversationPage';
import { StatsPage } from './features/stats/StatsPage';

function AppContent() {
  const { isReading, hasText, exitReaderMode } = useFocusMode();
  const currentView = useViewStore(state => state.currentView);

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

export default App;
