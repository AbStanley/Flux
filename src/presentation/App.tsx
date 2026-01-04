import { useEffect } from 'react';
import { ServiceProvider } from './contexts/ServiceContext';
import { ControlPanel } from './features/controls/ControlPanel';
import { ReaderView } from './features/reader/ReaderView';
import { useReaderStore } from './features/reader/store/useReaderStore';
import { ModeToggle } from './components/ui/mode-toggle';
import { FocusLayout } from './layouts/FocusLayout';
import { useFocusMode } from './features/reader/hooks/useFocusMode';

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
  // Use the selector to subscribe to updates
  const isReading = useReaderStore(state => state.isReading);
  const setText = useReaderStore(state => state.setText);
  const setIsReading = useReaderStore(state => state.setIsReading);

  useEffect(() => {
    // Check if running in extension context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (w.chrome && w.chrome.runtime && w.chrome.runtime.onMessage) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleMessage = (message: any) => {
        if (message.type === 'TEXT_SELECTED' && message.text) {
          setText(message.text);
          setIsReading(true);
        }
      };
      w.chrome.runtime.onMessage.addListener(handleMessage);

      // Check for pending text in storage (from "Read in Flux" action)
      if (w.chrome.storage && w.chrome.storage.local) {
        w.chrome.storage.local.get(['pendingText'], (result: any) => {
          if (result.pendingText) {
            setText(result.pendingText);
            setIsReading(true);
            // Clear it so it doesn't persist forever
            w.chrome.storage.local.remove('pendingText');
          }
        });
      }

      return () => w.chrome.runtime.onMessage.removeListener(handleMessage);
    }
  }, [setText, setIsReading]);

  return (
    <ServiceProvider>
      <div className={`container mx-auto ${isReading ? 'px-0 sm:px-4' : 'px-4'} flex flex-col ${isReading ? 'h-[100dvh] overflow-hidden max-w-[100vw] sm:max-w-[95vw]' : 'min-h-[100dvh] max-w-4xl py-4'}`}>
        <AppContent />
      </div>
    </ServiceProvider>
  );
}

function AppContent() {
  const { isReading, hasText, exitReaderMode } = useFocusMode();

  return (
    <>
      {!isReading && (
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-primary">Flux</h1>
          <ModeToggle />
        </header>
      )}

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
