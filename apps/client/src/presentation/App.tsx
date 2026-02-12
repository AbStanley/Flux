import { useEffect } from 'react';
import { ServiceProvider } from './contexts/ServiceContext';
import { ControlPanel } from './features/controls/ControlPanel';
import { ReaderView } from './features/reader/ReaderView';
import { useReaderStore } from './features/reader/store/useReaderStore';

import { FocusLayout } from './layouts/FocusLayout';
import { useFocusMode } from './features/reader/hooks/useFocusMode';
import { useGameStore } from './features/learning-mode/store/useGameStore';
import { useAuthStore } from './features/auth/store/useAuthStore';
import { LoginPage } from './features/auth/LoginPage';

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

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    import('@/infrastructure/api/base-url').then(({ getApiBaseUrl }) => {
      const defaultUrl = getApiBaseUrl();
      let urlToSet = config.aiHost || defaultUrl;

      const isLocalhostConfig = urlToSet.includes('localhost') || urlToSet.includes('127.0.0.1');
      if (!isExtension && isLocalhostConfig) {
        urlToSet = '';
        useGameStore.getState().updateConfig({ aiHost: '' });
      }

      import('@/infrastructure/ai/ServerAIService').then(({ serverAIService }) => {
        serverAIService.setBaseUrl(urlToSet);
      });
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

  // Auth gate: show login for web app users who aren't authenticated
  if (!isExtension && authLoading) {
    return null; // Brief loading state while checking token
  }
  if (!isExtension && !isAuthenticated) {
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
import { useViewStore } from './features/navigation/store/useViewStore';
import { AppView } from './features/navigation/types';
import { WordManager } from './features/word-manager';
import { LearningModePage } from './features/learning-mode/LearningModePage';

function AppContent() {
  const { isReading, hasText, exitReaderMode } = useFocusMode();
  const currentView = useViewStore(state => state.currentView);

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
    </>
  );
}

export default App;
