import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/global.css';
import FluxExtensionPopup from './FluxExtensionPopup';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <FluxExtensionPopup />
    </StrictMode>,
);
