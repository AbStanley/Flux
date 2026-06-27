import { useEffect, useState } from 'react';
import { ServiceProvider } from './contexts/ServiceContext';
import { motion } from 'framer-motion';
import { useReaderStore } from './features/reader/store/useReaderStore';
import { useGameStore } from './features/learning-mode/store/useGameStore';
import { useAuthStore } from './features/auth/store/useAuthStore';
import { authApi } from '@/infrastructure/api/auth';
import { LoginPage } from './features/auth/LoginPage';
import { cn } from "@/lib/utils";
import { AppContent } from './AppContent';
import { PwaUpdateToast } from './components/PwaUpdateToast';

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
  const { isAuthenticated, isInitializing, initialize } = useAuthStore();
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

  // Auto-migrate cached sessions to tokenize Markdown bold/italic on startup
  useEffect(() => {
    const store = useReaderStore.getState();
    if (
      store.text &&
      (!store.boldIndices || store.boldIndices.length === 0) &&
      (!store.italicIndices || store.italicIndices.length === 0) &&
      (store.text.includes('**') || store.text.includes('*'))
    ) {
      import('./features/reader/utils/tokenUtils').then(({ tokenizeWithMarkdown }) => {
        const { tokens, boldIndices, italicIndices } = tokenizeWithMarkdown(store.text);
        useReaderStore.setState({ tokens, boldIndices, italicIndices });
      });
    }
  }, []);

  // Use a delayed state for the layout classes to prevent "jumping" before transitions finish
  const [visualReadingMode, setVisualReadingMode] = useState(isReading);
  
  useEffect(() => {
    if (isReading) {
      // Immediately switch to reading mode to allow smooth expansion
      // Wrap in microtask to avoid synchronous setState in effect body lint error
      Promise.resolve().then(() => {
        setVisualReadingMode(true);
      });
    } else if (visualReadingMode) {
      // Only add delay when exiting from an active reading state
      const timer = setTimeout(() => setVisualReadingMode(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isReading, visualReadingMode]);

  // Auth gate: show login for unauthenticated users (both web app and side panel)
  if (isInitializing) {
    return null;
  }
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <ServiceProvider>
      <motion.div 
        initial={false}
        animate={{
          paddingLeft: visualReadingMode ? 0 : '1rem',
          paddingRight: visualReadingMode ? 0 : '1rem',
        }}
        transition={{ 
          duration: 0.6, 
          ease: [0.22, 1, 0.36, 1],
          paddingLeft: { duration: 0.6 },
          paddingRight: { duration: 0.6 },
        }}
        className={cn(
          "flex flex-col transition-none max-w-full",
          visualReadingMode 
            ? "h-[100dvh] overflow-hidden w-full max-w-none" 
            : cn("min-h-[100dvh] py-4", isExtension ? "w-full" : "container mx-auto max-w-4xl")
        )}
      >
        <AppContent />
      </motion.div>
      <PwaUpdateToast />
    </ServiceProvider>
  );
}

export default App;
