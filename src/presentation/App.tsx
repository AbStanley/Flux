import { ServiceProvider } from './contexts/ServiceContext';
import { ControlPanel } from './features/controls/ControlPanel';
import { ReaderView } from './features/reader/ReaderView';
import { useReaderStore } from './features/reader/store/useReaderStore';
import { ModeToggle } from './components/ui/mode-toggle';
import { FocusLayout } from './layouts/FocusLayout';
import { useFocusMode } from './features/reader/hooks/useFocusMode';

function App() {
  // Use the selector to subscribe to updates
  const isReading = useReaderStore(state => state.isReading);

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
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Reader Helper</h1>
        <ModeToggle />
      </header>

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
