import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/global.css';
import FluxExtensionPopup from './FluxExtensionPopup';
import { ThemeProvider } from '../presentation/providers/ThemeProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider defaultTheme="dark" storageKey="fluxTheme">
            <FluxExtensionPopup />
        </ThemeProvider>
    </StrictMode>,
);
