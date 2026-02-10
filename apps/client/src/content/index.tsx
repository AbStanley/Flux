import { createRoot } from 'react-dom/client';
import { FluxContentApp } from './FluxContentApp';
import styles from '../styles/global.css?inline'; // Import CSS as string
import { ServiceProvider } from '../presentation/contexts/ServiceContext';

console.log("[Reader Helper] Content script loaded");

// Create Host Element
const hostId = 'flux-reader-host';
let host = document.getElementById(hostId);

if (!host) {
    host = document.createElement('div');
    host.id = hostId;
    // Reset styles for the host to prevent inheritance issues affecting position
    host.style.position = 'absolute';
    host.style.top = '0';
    host.style.left = '0';
    host.style.width = '0';
    host.style.height = '0';
    host.style.zIndex = '2147483647'; // Max z-index
    document.body.appendChild(host);

    // Attach Shadow DOM
    const shadow = host.attachShadow({ mode: 'open' });

    // Inject Styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    shadow.appendChild(styleSheet);

    // Mount React App
    const root = createRoot(shadow);
    root.render(
        <ServiceProvider>
            <FluxContentApp />
        </ServiceProvider>
    );
}
