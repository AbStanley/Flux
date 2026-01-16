import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'

// Self-hosted book fonts for reading
import '@fontsource/merriweather'
import '@fontsource-variable/literata'
import '@fontsource-variable/lora'
import '@fontsource/crimson-pro'
import '@fontsource/eb-garamond'
import '@fontsource/inter'
import '@fontsource-variable/roboto-flex'

import App from './presentation/App.tsx'
import { ThemeProvider } from './presentation/providers/ThemeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="reader-ui-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
