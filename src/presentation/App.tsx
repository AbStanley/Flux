import { useState } from 'react';
import { ServiceProvider } from './contexts/ServiceContext';
import { ControlPanel } from './features/controls/ControlPanel';
import { ReaderView } from './features/reader/ReaderView';
import styles from './App.module.css';

function App() {
  const [text, setText] = useState('');

  return (
    <ServiceProvider>
      <div className={styles.appContainer}>
        <header className={styles.header}>
          <h1>Reader Helper</h1>
        </header>

        <main className={styles.main}>
          <ControlPanel onTextChange={setText} />
          {text && <ReaderView text={text} />}
        </main>
      </div>
    </ServiceProvider>
  );
}

export default App;
